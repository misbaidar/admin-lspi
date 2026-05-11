import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  Loader2,
  Save,
  X,
  Upload,
  Edit2,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { useAlert } from "../../context/AlertContext";
import {
  getOrganizationStructureById,
  createOrganizationStructure,
  updateOrganizationStructure,
} from "../../services/organizationService";
import type {
  OrganizationStructure,
  Sektor,
  Posisi,
  OrganisasiMember,
} from "../../types";

const StrukturOrganisasiForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [periode, setPeriode] = useState("");
  const [sektors, setSektors] = useState<Sektor[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedContext, setSelectedContext] = useState<{ sektorId: string; posisiId: string } | null>(null);
  const [editingMember, setEditingMember] = useState<OrganisasiMember | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (id) {
        try {
          const structure = await getOrganizationStructureById(id);
          if (structure) {
            setPeriode(structure.periode);
            setSektors(structure.sektors || []);
          }
        } catch (err) {
          console.error(err);
          showAlert("Gagal memuat data", "error");
          navigate("/organization");
        } finally {
          setLoading(false);
        }
      } else {
        // Initialize dengan dua sektor default
        initializeDefaultStructure();
      }
    };
    loadData();
  }, [id, showAlert, navigate]);

  const initializeDefaultStructure = () => {
    const newSektors: Sektor[] = [
      {
        id: `sektor-${Date.now()}-1`,
        nama_sektor: "Rijal",
        posisi: [
          {
            id: `posisi-${Date.now()}-0`,
            nama_posisi: "Ketua Umum",
            order: 0,
            anggota: [],
          },
        ],
      },
      {
        id: `sektor-${Date.now()}-2`,
        nama_sektor: "Nisa",
        posisi: [],
      },
    ];
    setSektors(newSektors);
    setLoading(false);
  };

  const handleAddPosition = (sektorId: string) => {
    setSektors(
      sektors.map((sektor) => {
        if (sektor.id === sektorId) {
          const newPosisi: Posisi = {
            id: `posisi-${Date.now()}`,
            nama_posisi: "Posisi Baru",
            order: (sektor.posisi?.length || 0) + 1,
            anggota: [],
          };
          return {
            ...sektor,
            posisi: [...(sektor.posisi || []), newPosisi],
          };
        }
        return sektor;
      })
    );
  };

  const handleDeletePosition = (sektorId: string, posisiId: string) => {
    setSektors(
      sektors.map((sektor: Sektor) => {
        if (sektor.id === sektorId) {
          return {
            ...sektor,
            posisi: (sektor.posisi || []).filter((p: Posisi) => p.id !== posisiId),
          };
        }
        return sektor;
      })
    );
  };

  const handleUpdatePositionName = (
    sektorId: string,
    posisiId: string,
    newName: string
  ) => {
    setSektors(
      sektors.map((sektor: Sektor) => {
        if (sektor.id === sektorId) {
          return {
            ...sektor,
            posisi: (sektor.posisi || []).map((p: Posisi) =>
              p.id === posisiId ? { ...p, nama_posisi: newName } : p
            ),
          };
        }
        return sektor;
      })
    );
  };

  const handleAddMember = (
    sektorId: string,
    posisiId: string,
    member: OrganisasiMember
  ) => {
    setSektors(
      sektors.map((sektor: Sektor) => {
        if (sektor.id === sektorId) {
          return {
            ...sektor,
            posisi: (sektor.posisi || []).map((p: Posisi) => {
              if (p.id === posisiId) {
                // Check if this position is single-member only
                const isSingleMemberPosition =
                  p.nama_posisi === "Ketua Umum" ||
                  p.nama_posisi === "Sekretaris Jendral";
                
                // If already has member and is single-member position, replace it
                if (isSingleMemberPosition && (p.anggota || []).length > 0) {
                  return { ...p, anggota: [member] };
                }
                
                return {
                  ...p,
                  anggota: [...(p.anggota || []), member],
                };
              }
              return p;
            }),
          };
        }
        return sektor;
      })
    );
    setShowModal(false);
    setSelectedContext(null);
    setEditingMember(null);
  };

  const handleUpdateMember = (
    sektorId: string,
    posisiId: string,
    updatedMember: OrganisasiMember
  ) => {
    setSektors(
      sektors.map((sektor: Sektor) => {
        if (sektor.id === sektorId) {
          return {
            ...sektor,
            posisi: (sektor.posisi || []).map((p: Posisi) =>
              p.id === posisiId
                ? {
                    ...p,
                    anggota: (p.anggota || []).map((m: OrganisasiMember) =>
                      m.id === updatedMember.id ? updatedMember : m
                    ),
                  }
                : p
            ),
          };
        }
        return sektor;
      })
    );
    setShowModal(false);
    setSelectedContext(null);
    setEditingMember(null);
  };

  const handleDeleteMember = (
    sektorId: string,
    posisiId: string,
    memberId: string
  ) => {
    setSektors(
      sektors.map((sektor: Sektor) => {
        if (sektor.id === sektorId) {
          return {
            ...sektor,
            posisi: (sektor.posisi || []).map((p: Posisi) =>
              p.id === posisiId
                ? {
                    ...p,
                    anggota: (p.anggota || []).filter((m: OrganisasiMember) => m.id !== memberId),
                  }
                : p
            ),
          };
        }
        return sektor;
      })
    );
  };

  // Utility function to remove undefined values from objects
  const cleanData = (data: unknown): unknown => {
    if (Array.isArray(data)) {
      return data.map(item => cleanData(item));
    }
    if (data !== null && typeof data === 'object') {
      return Object.fromEntries(
        Object.entries(data as Record<string, unknown>)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => [key, cleanData(value)])
      );
    }
    return data;
  };

  const handleSave = async () => {
    if (!periode.trim()) {
      showAlert("Validasi", "Periode tidak boleh kosong", "warning");
      return;
    }

    try {
      setSaving(true);
      const cleanedSektors = cleanData(sektors) as Sektor[];
      const structure: Omit<
        OrganizationStructure,
        "id" | "createdAt" | "updatedAt"
      > = {
        periode,
        sektors: cleanedSektors,
      };

      if (id) {
        await updateOrganizationStructure(id, structure);
        showAlert("Berhasil", "Struktur organisasi berhasil diperbarui", "success");
      } else {
        await createOrganizationStructure(structure);
        showAlert("Berhasil", "Struktur organisasi berhasil dibuat", "success");
      }
      navigate("/organization");
    } catch (error) {
      showAlert("Error", "Gagal menyimpan data", "error");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-main" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {id ? "Edit" : "Buat"} Struktur Organisasi
          </h1>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate("/organization")}
          className="text-gray-600 border-gray-300"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Periode Input */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <Label className="text-gray-700 font-semibold mb-2">Periode</Label>
        <Input
          type="text"
          value={periode}
          onChange={(e) => setPeriode(e.target.value)}
          placeholder="Contoh: 2025-2026"
          className="border-gray-300"
        />
        <p className="text-xs text-gray-500 mt-2">Format: YYYY-YYYY (contoh: 2025-2026)</p>
      </div>

      {/* Sectors Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sektors.map((sektor) => (
          <div key={sektor.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Sektor Title */}
            <h2 className="text-xl font-bold text-brand-dark mb-6">
              Divisi {sektor.nama_sektor}
            </h2>

            {/* Positions Grid */}
            <div className="space-y-4">
              {sektor.posisi && sektor.posisi.length > 0 ? (
                sektor.posisi.map((posisi: Posisi) => {
                  const isSingleMember =
                    posisi.nama_posisi === "Ketua Umum" ||
                    posisi.nama_posisi === "Sekretaris Jendral";
                  const isFull =
                    isSingleMember && (posisi.anggota || []).length > 0;

                  return (
                    <div
                      key={posisi.id}
                      className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3"
                    >
                      {/* Position Name */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <Input
                            type="text"
                            value={posisi.nama_posisi}
                            onChange={(e) =>
                              handleUpdatePositionName(
                                sektor.id,
                                posisi.id,
                                e.target.value
                              )
                            }
                            className="font-bold text-gray-900 border-gray-200"
                          />
                          {isSingleMember && (
                            <p className="text-xs text-amber-600 mt-1">
                              ⭐ Hanya 1 orang
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          onClick={() =>
                            handleDeletePosition(sektor.id, posisi.id)
                          }
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Members List */}
                      <div className="space-y-2">
                        {posisi.anggota && posisi.anggota.length > 0 ? (
                          <div className="space-y-2">
                            {posisi.anggota.map((member: OrganisasiMember) => (
                              <div
                                key={member.id}
                                className="bg-white p-3 rounded border border-gray-200 flex items-center justify-between gap-2 group"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  {/* Photo Avatar */}
                                  <div className="shrink-0">
                                    {member.foto ? (
                                      <img
                                        src={member.foto}
                                        alt={member.nama}
                                        className="h-8 w-8 object-cover rounded-full border border-gray-300"
                                      />
                                    ) : (
                                      <div className="h-8 w-8 rounded-full bg-linear-to-br from-brand-main to-brand-dark flex items-center justify-center text-white text-xs font-semibold">
                                        {member.nama.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                  {/* Member Info */}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 text-sm">
                                      {member.nama}
                                    </p>
                                    {member.email && (
                                      <p className="text-xs text-gray-500 truncate">
                                        {member.email}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setEditingMember(member);
                                      setSelectedContext({
                                        sektorId: sektor.id,
                                        posisiId: posisi.id,
                                      });
                                      setShowModal(true);
                                    }}
                                    className="text-brand-main border-brand-main hover:bg-brand-main/10"
                                    size="sm"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() =>
                                      handleDeleteMember(
                                        sektor.id,
                                        posisi.id,
                                        member.id
                                      )
                                    }
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                    size="sm"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-2 text-center text-xs text-gray-500">
                            Belum ada anggota
                          </div>
                        )}
                      </div>

                      {/* Add Member Button */}
                      {isFull ? (
                        <div className="text-xs text-amber-600 font-medium text-center py-1">
                          ✓ Posisi sudah lengkap
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedContext({
                              sektorId: sektor.id,
                              posisiId: posisi.id,
                            });
                            setShowModal(true);
                          }}
                          className="w-full text-brand-main border-brand-main hover:bg-brand-main/10 font-medium text-sm"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Tambah Anggota
                        </Button>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-400 text-center py-4">
                  Belum ada posisi
                </p>
              )}

              {/* Add Position Button */}
              <Button
                variant="outline"
                onClick={() => handleAddPosition(sektor.id)}
                className="w-full text-brand-main border-brand-main hover:bg-brand-main/10 font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Posisi
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => navigate("/organization")}
          className="text-gray-600 border-gray-300"
        >
          Batal
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand-main hover:bg-brand-dark"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Simpan
            </>
          )}
        </Button>
      </div>

      {/* Member Modal */}
      {showModal && selectedContext && (
        <MemberModal
          isEditing={!!editingMember}
          initialData={editingMember}
          onAdd={(member) =>
            handleAddMember(
              selectedContext.sektorId,
              selectedContext.posisiId,
              member
            )
          }
          onUpdate={(member) =>
            handleUpdateMember(
              selectedContext.sektorId,
              selectedContext.posisiId,
              member
            )
          }
          onClose={() => {
            setShowModal(false);
            setSelectedContext(null);
            setEditingMember(null);
          }}
        />
      )}
    </div>
  );
};

interface MemberModalProps {
  isEditing?: boolean;
  initialData?: OrganisasiMember | null;
  onAdd: (member: OrganisasiMember) => void;
  onUpdate: (member: OrganisasiMember) => void;
  onClose: () => void;
}

const MemberModal = ({ 
  isEditing = false, 
  initialData, 
  onAdd, 
  onUpdate, 
  onClose 
}: MemberModalProps) => {
  const { showAlert } = useAlert();
  const [formData, setFormData] = useState({
    nama: initialData?.nama || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    bio: initialData?.bio || "",
    foto: initialData?.foto || "",
  });
  const [preview, setPreview] = useState<string | null>(initialData?.foto || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showAlert("Ukuran file terlalu besar", "Maksimal 5MB");
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        showAlert("Format tidak valid", "Hanya file gambar yang didukung");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        setFormData({ ...formData, foto: base64String });
        setPreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = () => {
    if (!formData.nama.trim()) {
      showAlert("Validasi", "Nama tidak boleh kosong", "warning");
      return;
    }

    if (isEditing && initialData) {
      // Update existing member
      const updatedMember: OrganisasiMember = {
        ...initialData,
        nama: formData.nama,
      };

      if (formData.email.trim()) updatedMember.email = formData.email;
      if (formData.phone.trim()) updatedMember.phone = formData.phone;
      if (formData.bio.trim()) updatedMember.bio = formData.bio;
      if (formData.foto.trim()) updatedMember.foto = formData.foto;

      onUpdate(updatedMember);
    } else {
      // Add new member
      const newMember: OrganisasiMember = {
        id: `member-${Date.now()}`,
        nama: formData.nama,
      };

      if (formData.email.trim()) newMember.email = formData.email;
      if (formData.phone.trim()) newMember.phone = formData.phone;
      if (formData.bio.trim()) newMember.bio = formData.bio;
      if (formData.foto.trim()) newMember.foto = formData.foto;

      onAdd(newMember);
    }

    setFormData({ nama: "", email: "", phone: "", bio: "", foto: "" });
    setPreview(null);
  };

  return (
    <>
      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        {/* Modal Content */}
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="sticky top-0 bg-linear-to-r from-brand-main/10 to-brand-dark/10 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-brand-dark">
              {isEditing ? "Edit Anggota" : "Tambah Anggota Baru"}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-4">
            {/* Photo Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                Foto Profil (opsional)
              </Label>
              <div className="flex flex-col items-center gap-3">
                {preview ? (
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Preview"
                      className="h-24 w-24 object-cover rounded-lg border-2 border-brand-main"
                    />
                    <button
                      onClick={() => {
                        setPreview(null);
                        setFormData({ ...formData, foto: "" });
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="h-24 w-24 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <Upload className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-brand-main cursor-pointer hover:text-brand-dark font-medium"
                >
                  {preview ? "Ubah Foto" : "Pilih Foto"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Name Input */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                Nama Lengkap *
              </Label>
              <Input
                type="text"
                placeholder="Masukkan nama lengkap"
                value={formData.nama}
                onChange={(e) =>
                  setFormData({ ...formData, nama: e.target.value })
                }
                className="border-gray-300 focus:border-brand-main"
              />
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-700">
                  Email (opsional)
                </Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="border-gray-300 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-700">
                  Telepon (opsional)
                </Label>
                <Input
                  type="tel"
                  placeholder="08xx xxxx xxxx"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="border-gray-300 text-sm"
                />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                Bio (opsional)
              </Label>
              <Input
                type="text"
                placeholder="Deskripsi singkat"
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                className="border-gray-300"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="border-t border-gray-200 px-6 py-4 flex gap-2 bg-gray-50">
            <Button
              onClick={handleAdd}
              className="flex-1 bg-brand-main hover:bg-brand-dark text-white font-medium"
            >
              {isEditing ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Perubahan
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 text-gray-600 border-gray-300 font-medium"
            >
              Batal
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default StrukturOrganisasiForm;
