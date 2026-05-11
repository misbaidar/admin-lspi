import { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { useAlert } from "../../context/AlertContext";
import {
  getAllOrganizationStructures,
  deleteOrganizationStructure,
} from "../../services/organizationService";
import type { OrganizationStructure } from "../../types";

const StrukturOrganisasiList = () => {
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useAlert();

  const [structures, setStructures] = useState<OrganizationStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriode, setSelectedPeriode] = useState<string | null>(null);

  const fetchStructures = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllOrganizationStructures();
      setStructures(data);
      if (data.length > 0) {
        // Auto-select period based on current year
        const currentYear = new Date().getFullYear();
        const currentYearPeriode = data.find((structure) => {
          // Extract years from periode (format: YYYY-YYYY)
          const years = structure.periode.split("-").map(y => parseInt(y, 10));
          // Check if current year is within the period range
          return years.length === 2 && currentYear >= years[0] && currentYear <= years[1];
        });
        
        // If found matching period, use it; otherwise use the first one
        setSelectedPeriode((currentYearPeriode?.id) || (data[0].id || null));
      }
    } catch (error) {
      showAlert("Error", "Gagal memuat data", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchStructures();
  }, [fetchStructures]);

  const handleDelete = async (id: string, periode: string) => {
    showConfirm(
      "Hapus Struktur Organisasi",
      `Yakin ingin menghapus struktur organisasi periode ${periode}?`,
      async () => {
        try {
          await deleteOrganizationStructure(id);
          setStructures(structures.filter((s) => s.id !== id));
          if (selectedPeriode === id) {
            setSelectedPeriode(structures.length > 1 ? structures[1].id || null : null);
          }
          showAlert("Berhasil", "Struktur organisasi berhasil dihapus", "success");
        } catch (error) {
          showAlert("Error", "Gagal menghapus struktur organisasi", "error");
          console.error(error);
        }
      }
    );
  };

  const selectedStructure = structures.find((s) => s.id === selectedPeriode);

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Struktur Organisasi</h1>
          <p className="text-gray-500 mt-1">Kelola struktur organisasi untuk setiap periode</p>
        </div>
        <Button onClick={() => navigate("/organization/new")} className="bg-brand-main hover:bg-brand-dark">
          <Plus className="mr-2 h-4 w-4" />
          Buat Periode Baru
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-main" />
        </div>
      ) : structures.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada struktur organisasi</h3>
          <p className="text-gray-500 mb-6">Mulai dengan membuat struktur organisasi untuk periode pertama</p>
          <Button onClick={() => navigate("/organization/new")} className="bg-brand-main hover:bg-brand-dark">
            <Plus className="mr-2 h-4 w-4" />
            Buat Periode Pertama
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Daftar Periode */}
          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 h-fit">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="font-semibold text-gray-900">Daftar Periode</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {structures.map((structure) => (
                <button
                  key={structure.id}
                  onClick={() => setSelectedPeriode(structure.id || null)}
                  className={`w-full text-left px-6 py-3 transition-colors ${
                    selectedPeriode === structure.id
                      ? "bg-brand-main/10 text-brand-main font-medium"
                      : "hover:bg-gray-50 text-gray-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{structure.periode}</span>
                    {selectedPeriode === structure.id && (
                      <div className="w-2 h-2 bg-brand-main rounded-full"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Detail Periode */}
          <div className="lg:col-span-2">
            {selectedStructure ? (
              <div className="space-y-6">
                {/* Header Detail */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedStructure.periode}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Kelola struktur organisasi untuk periode ini
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() =>
                          navigate(`/organization/edit/${selectedStructure.id}`)
                        }
                        className="text-gray-600 border-gray-300 hover:bg-gray-50"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleDelete(selectedStructure.id || "", selectedStructure.periode)
                        }
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Sektor Overview */}
                {selectedStructure.sektors && selectedStructure.sektors.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedStructure.sektors.map((sektor) => (
                      <div
                        key={sektor.id}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                      >
                        <h3 className="font-semibold text-gray-900 mb-4">
                          Divisi {sektor.nama_sektor}
                        </h3>
                        <div className="space-y-2">
                          {sektor.posisi && sektor.posisi.length > 0 ? (
                            sektor.posisi.map((posisi) => (
                              <div key={posisi.id} className="text-sm">
                                <div className="font-medium text-gray-700">
                                  {posisi.nama_posisi}
                                </div>
                                {posisi.anggota && posisi.anggota.length > 0 ? (
                                  <div className="mt-1 space-y-1">
                                    {posisi.anggota.map((member) => (
                                      <div
                                        key={member.id}
                                        className="text-xs text-gray-600 pl-2 border-l-2 border-brand-main flex items-center gap-2"
                                      >
                                        {/* Photo Avatar */}
                                        {member.foto ? (
                                          <img
                                            src={member.foto}
                                            alt={member.nama}
                                            className="h-5 w-5 object-cover rounded-full border border-gray-300 shrink-0"
                                          />
                                        ) : (
                                          <div className="h-5 w-5 rounded-full bg-linear-to-br from-brand-main to-brand-dark flex items-center justify-center text-white text-xs font-semibold shrink-0">
                                            {member.nama.charAt(0).toUpperCase()}
                                          </div>
                                        )}
                                        <span>{member.nama}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-400 italic">
                                    Belum ada anggota
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-400">Belum ada posisi</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                    <AlertCircle className="mx-auto h-8 w-8 text-yellow-600 mb-2" />
                    <p className="text-sm text-yellow-700">
                      Belum ada divisi yang dikonfigurasi. Klik edit untuk menambahkan.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-500">Pilih periode dari daftar di sebelah kiri</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StrukturOrganisasiList;
