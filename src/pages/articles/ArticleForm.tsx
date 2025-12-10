import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams, Link } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";
import { Save, ArrowLeft, Loader2, Image as ImageIcon } from "lucide-react"; // Added Icons

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
// Import createArticle dan updateArticle
import { getArticleById, updateArticle, createArticle, generateSlug, triggerPublicRebuild } from "../../services/articleService";
import type { Article } from "../../types";
import { TagInput } from "../../components/ui/TagInput";
import { useAuth } from "../../context/AuthContext";
import { useAlert } from "../../context/AlertContext"; // Import Alert

type ArticleFormInputs = Omit<Article, "id" | "createdAt" | "content"> & {
  tags: string[];
};

const ArticleForm = () => {
  const { userProfile, isAdmin } = useAuth();
  const { showAlert } = useAlert(); // Use Hook Alert
  const { id } = useParams(); // Ambil ID (jika ada)
  const navigate = useNavigate();
  
  const isEditMode = Boolean(id); // True jika Edit, False jika Create

  const [content, setContent] = useState<string>(""); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(isEditMode); // Loading hanya jika edit
  const [isDragOver, setIsDragOver] = useState(false); // State for Drag & Drop style

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<ArticleFormInputs>({
    defaultValues: {
      status: "Draft",
      category: "Opini",
      tags: [],
      thumbnail: "",
      // Jika mode create, default penulis = user login
      author: userProfile?.displayName || "Admin LSPI" 
    }
  });

  // --- 1. IMAGE PROCESSING LOGIC (Base64) ---
  // Sama seperti di Profile Settings, tapi Max Width 800px agar tidak pecah untuk artikel
  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800; // Lebih besar dari profil (300) agar bagus di artikel
          const scaleSize = MAX_WIDTH / img.width;
          
          // Jika gambar asli lebih kecil dari MAX_WIDTH, jangan di-upscale
          if (img.width > MAX_WIDTH) {
              canvas.width = MAX_WIDTH;
              canvas.height = img.height * scaleSize;
          } else {
              canvas.width = img.width;
              canvas.height = img.height;
          }

          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Convert ke Base64 (JPEG quality 0.8)
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          resolve(dataUrl);
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showAlert("Format Salah", "Mohon upload file gambar (JPG/PNG).", "error");
      return;
    }
    try {
      // Proses konversi ke Base64
      const resizedBase64 = await processImage(file);
      // Set value ke React Hook Form
      setValue("thumbnail", resizedBase64); 
    } catch (error) {
      showAlert("Gagal", "Gagal memproses gambar.", "error");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };
  // ------------------------------------------

  // 2. Fetch Data (Hanya jika Edit Mode)
  useEffect(() => {
    const fetchData = async () => {
      if (!isEditMode || !id) return;
      
      try {
        const article = await getArticleById(id);
        if (article) {
          reset({
            title: article.title,
            slug: article.slug,
            thumbnail: article.thumbnail,
            excerpt: article.excerpt,
            author: article.author,
            category: article.category,
            tags: article.tags || [],
            status: article.status,
          });
          setContent(article.content);
        } else {
          showAlert("404", "Artikel tidak ditemukan!", "error");
          navigate("/articles");
        }
      } catch (error) {
        console.error(error);
        showAlert("Error", "Gagal memuat data artikel.", "error");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [id, isEditMode, navigate, reset, showAlert]);

  // 3. Auto-generate Slug
  const titleValue = watch("title");
  useEffect(() => {
    // Update slug jika judul berubah dan tidak sedang loading data awal edit
    if (!isLoadingData && titleValue) {
       setValue("slug", generateSlug(titleValue));
    }
  }, [titleValue, setValue, isLoadingData]);

  const tagsValue = watch("tags");
  const thumbnailValue = watch("thumbnail"); // Watch thumbnail untuk preview

  // 4. Handle Submit (Create / Update)
  const onSubmit = async (data: ArticleFormInputs) => {
    if (!content || content.trim() === "") {
      showAlert("Validasi Gagal", "Konten artikel tidak boleh kosong!", "error");
      return;
    }

    if (!data.thumbnail) {
      showAlert("Validasi Gagal", "Thumbnail artikel wajib diupload!", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const articleData = {
        ...data,
        content: content,
      };

      if (isEditMode && id) {
        // --- LOGIC UPDATE ---
        await updateArticle(id, articleData);
        showAlert("Berhasil", "Artikel berhasil diperbarui.", "success");
      } else {
        // --- LOGIC CREATE ---
        await createArticle(articleData);
        showAlert("Berhasil", "Artikel baru berhasil dibuat.", "success");
      }

      // 🔥 TRIGGER REBUILD OTOMATIS
      // Hanya jika statusnya Published, agar hemat resource
      if (data.status === 'Published') {
         // Kita jalankan di background (tanpa await) agar Admin tidak lemot
         triggerPublicRebuild(); 
      }
      
      navigate("/articles");
    } catch (error) {
      console.error(error);
      showAlert("Gagal", "Gagal menyimpan artikel.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-main" />
        <span className="ml-2 text-gray-500">Memuat data artikel...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/articles" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
             <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? "Edit Artikel" : "Tulis Artikel Baru"}
            </h1>
            {isEditMode && <p className="text-xs text-gray-400">ID: {id}</p>}
          </div>
        </div>
        <div className="flex gap-3">
           <Button variant="outline" onClick={() => navigate("/articles")} disabled={isSubmitting}>
             Batal
           </Button>
           <Button onClick={handleSubmit(onSubmit)} isLoading={isSubmitting}>
             <Save className="w-4 h-4 mr-2" />
             {isEditMode ? "Simpan Perubahan" : "Terbitkan Artikel"}
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* KOLOM UTAMA (KIRI) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <Label htmlFor="title">Judul Artikel</Label>
            <Input 
              id="title" 
              className="text-lg font-medium"
              error={!!errors.title}
              {...register("title", { required: "Judul wajib diisi" })} 
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            
            <div className="mt-3 text-xs text-gray-500">
              <span className="font-semibold">URL: </span>
              .../artikel/<span className="text-brand-main">{watch("slug")}</span>
            </div>
          </div>

          <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div data-color-mode="light">
              <MDEditor
                value={content}
                onChange={(val) => setContent(val || "")}
                height={500}
                preview="edit"
              />
            </div>
          </div>
        </div>

        {/* KOLOM SIDEBAR (KANAN) */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
            <div>
              <Label>Status Publikasi</Label>
              <select 
                {...register("status")}
                className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-main/20"
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
              </select>
            </div>

            <div>
              <Label>Kategori</Label>
              <select 
                {...register("category")}
                className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-main/20"
              >
                <option value="Opini">Opini</option>
                <option value="Berita">Berita</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            
            <div>
                <Label>Tags / Topik</Label>
                <TagInput 
                value={tagsValue || []}
                onChange={(newTags) => setValue("tags", newTags)}
                placeholder="Ketik tag..."
                />
                <p className="text-xs text-gray-400 mt-1">
                    Tekan <b>Enter</b> untuk membuat tag baru.
                </p>
            </div>

            <div>
               <Label>Penulis</Label>
               <Input {...register("author")} readOnly={!isAdmin} className={!isAdmin ? "bg-gray-100 hover:cursor-not-allowed" : ""} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <Label>Gambar Thumbnail</Label>
            
            {/* DRAG AND DROP ZONE */}
            <div 
                className={`
                mt-2 relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer overflow-hidden
                ${isDragOver ? 'border-brand-main bg-brand-main/5' : 'border-gray-300 hover:border-brand-main hover:bg-gray-50'}
                `}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
            >
                <input 
                    type="file" 
                    id="thumbnail-upload" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    accept="image/*"
                    onChange={handleImageChange}
                />

                {/* Preview Area */}
                {thumbnailValue ? (
                    <div className="w-full relative group">
                        <div className="aspect-video w-full rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                            <img 
                                src={thumbnailValue} 
                                alt="Thumbnail Preview" 
                                className="w-full h-full object-cover" 
                            />
                        </div>
                    </div>
                ) : (
                    <div className="py-8 flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 text-gray-400">
                             <ImageIcon className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                            <span className="text-brand-main">Klik upload</span> atau drag & drop
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Format JPG, PNG (Max 800px width)
                        </p>
                    </div>
                )}
            </div>
            
            {/* Hidden Input untuk validasi required bawaan form (opsional, sudah dihandle di onSubmit) */}
            <input type="hidden" {...register("thumbnail")} />
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <Label>Ringkasan Singkat</Label>
            <textarea 
              {...register("excerpt", { required: "Ringkasan wajib diisi" })}
              className="w-full p-3 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-main/20 min-h-[100px]"
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleForm;