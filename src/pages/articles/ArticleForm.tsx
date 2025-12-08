import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams, Link } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";
import { Save, ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
// Import createArticle dan updateArticle
import { getArticleById, updateArticle, createArticle, generateSlug } from "../../services/articleService";
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

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<ArticleFormInputs>({
    defaultValues: {
      status: "Draft",
      category: "Opini",
      tags: [],
      // Jika mode create, default penulis = user login
      author: userProfile?.displayName || "Admin LSPI" 
    }
  });

  // 1. Fetch Data (Hanya jika Edit Mode)
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

  // 2. Auto-generate Slug
  const titleValue = watch("title");
  useEffect(() => {
    // Update slug jika judul berubah dan tidak sedang loading data awal edit
    if (!isLoadingData && titleValue) {
       setValue("slug", generateSlug(titleValue));
    }
  }, [titleValue, setValue, isLoadingData]);

  const tagsValue = watch("tags");

  // 3. Handle Submit (Create / Update)
  const onSubmit = async (data: ArticleFormInputs) => {
    if (!content || content.trim() === "") {
      showAlert("Validasi Gagal", "Konten artikel tidak boleh kosong!", "error");
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
            <Label>Thumbnail Image (URL)</Label>
            <Input {...register("thumbnail", { required: "Link gambar wajib diisi" })} />
            
            {watch("thumbnail") && (
              <div className="mt-4 rounded-lg overflow-hidden border border-gray-200 aspect-video bg-gray-50">
                <img 
                  src={watch("thumbnail")} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                  onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/300?text=Error")} 
                />
              </div>
            )}
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