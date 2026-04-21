import React from "react";

const API_BASE_URL = "http://localhost:3000";
const categories = [
  "Dil ve Konusma",
  "Ergoterapi",
  "Ozel Egitim",
  "Duyu Butunleme",
  "Psikolog",
];
const timeSlots = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00"];

async function fetchJson(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);

  if (!response.ok) {
    throw new Error(`Istek basarisiz oldu: ${response.status}`);
  }

  return response.json();
}

export default function LessonFlowDashboard() {
  const [selectedCategory, setSelectedCategory] = React.useState(null);
  const [teachers, setTeachers] = React.useState([]);
  const [lessons, setLessons] = React.useState([]);
  const [students, setStudents] = React.useState([]);
  const [selectedTeacher, setSelectedTeacher] = React.useState(null);
  const [selectedStudentId, setSelectedStudentId] = React.useState(null);
  const [activeSlot, setActiveSlot] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [newStudentName, setNewStudentName] = React.useState("");
  const [successMessage, setSuccessMessage] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  const fetchLessons = React.useCallback(async () => {
    const data = await fetchJson("/lessons");
    setLessons(Array.isArray(data) ? data : []);
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [teachersData, lessonsData, studentsData] = await Promise.all([
          fetchJson("/teachers"),
          fetchJson("/lessons"),
          fetchJson("/students"),
        ]);

        if (cancelled) {
          return;
        }

        setTeachers(Array.isArray(teachersData) ? teachersData : []);
        setLessons(Array.isArray(lessonsData) ? lessonsData : []);
        setStudents(Array.isArray(studentsData) ? studentsData : []);
      } catch (error) {
        if (!cancelled) {
          console.error("Veriler yüklenirken hata oluştu:", error);
          setErrorMessage(
            "Veriler şu an yüklenemiyor. Backend ve veritabani bağlantısını kontrol edin.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    function handleEsc(event) {
      if (event.key === "Escape") {
        closeModal();
      }
    }

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  React.useEffect(() => {
    if (!successMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setSuccessMessage(""), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  const filteredTeachers = React.useMemo(() => {
    if (!selectedCategory) {
      return teachers;
    }

    return teachers.filter((teacher) => {
      if (typeof teacher.category !== "string") {
        return true;
      }

      return teacher.category === selectedCategory;
    });
  }, [selectedCategory, teachers]);

  const teacherLessons = React.useMemo(() => {
    if (!selectedTeacher) {
      return [];
    }

    return lessons.filter((lesson) => Number(lesson.teacher_id) === selectedTeacher.id);
  }, [lessons, selectedTeacher]);

  function closeModal() {
    setActiveSlot(null);
    setSelectedStudentId(null);
    setNewStudentName("");
  }

  async function createLesson() {
    if (!activeSlot || !selectedStudentId) {
      alert("Lutfen ogrenci secin.");
      return;
    }

    try {
      setErrorMessage("");
      setIsSaving(true);

      await fetchJson("/lessons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teacher_id: activeSlot.teacherId,
          student_id: Number(selectedStudentId),
          date: "2026-04-19",
          start_time: activeSlot.time,
          end_time: `${String(Number(activeSlot.time.slice(0, 2)) + 1).padStart(2, "0")}:00`,
        }),
      });

      await fetchLessons();
      setSuccessMessage("Ders başarıyla eklendi");
      closeModal();
    } catch (error) {
      console.error("Ders eklenemedi:", error);
      setErrorMessage("Ders kaydedilemedi. Lutfen tekrar deneyin.");
    } finally {
      setIsSaving(false);
    }
  }

  async function createStudent() {
    if (!newStudentName.trim()) {
      alert("Öğrenci adı gir");
        return;
      }

    try {
      const newStudent = await fetchJson("/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
       },
        body: JSON.stringify({ name: newStudentName }),
      });

      // listeyi güncelle
      setStudents((prev) => [...prev, newStudent]);

      // otomatik seç
      setSelectedStudentId(newStudent.id);

      // input temizle
      setNewStudentName("");
    } 
    catch (err) {
      console.error("Öğrenci eklenemedi:", err);
      alert("Öğrenci eklenemedi. Lütfen tekrar deneyin.");}
  }

  async function deleteLesson(id) {
    try {
      await fetchJson(`/lessons/${id}`, {
        method: "DELETE",
      });

      await fetchLessons(); // listeyi yenile
      setSuccessMessage("Ders başarıyla silindi");
    } 
    catch (err) {
      console.error("Ders silinemedi:", err);
      alert("Ders silinemedi. Lütfen tekrar deneyin.");}
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">LessonFlow</h1>
          <p className="mt-2 text-slate-500">
            Dersleri, öğretmenleri ve boş saatleri yonetin.
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {isLoading && (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            Veriler yukleniyor...
          </div>
        )}

        {!selectedCategory && !isLoading && (
          <div>
            <h2 className="mb-4 text-2xl font-semibold text-slate-700">Dersler</h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className="rounded-3xl border border-slate-200 bg-white p-6 text-left shadow transition hover:shadow-lg"
                >
                  <h3 className="text-xl font-semibold text-slate-800">{category}</h3>
                  <p className="mt-2 text-slate-500">
                    Bu branştaki öğretmenleri ve boş saatleri görüntüleyin.
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedCategory && !selectedTeacher && !isLoading && (
          <div>
            <button
              onClick={() => setSelectedCategory(null)}
              className="mb-4 text-sm text-blue-600 hover:underline"
            >
              Derslere geri dön
            </button>

            <h2 className="mb-4 text-2xl font-semibold text-slate-700">
              {selectedCategory} Öğretmenleri
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredTeachers.map((teacher) => {
                const teacherLessonCount = lessons.filter(
                  (lesson) => Number(lesson.teacher_id) === teacher.id,
                ).length;

                return (
                  <button
                    key={teacher.id}
                    onClick={() => setSelectedTeacher(teacher)}
                    className="rounded-3xl border border-slate-200 bg-white p-6 text-left shadow transition hover:shadow-lg"
                  >
                    <h3 className="text-xl font-semibold text-slate-800">{teacher.name}</h3>

                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                      <p>{teacherLessonCount} ders planlanmış</p>
                      <p>
                        {
                          timeSlots.filter(
                            (time) =>
                              !lessons.some(
                                (lesson) =>
                                  Number(lesson.teacher_id) === teacher.id &&
                                  lesson.start_time?.slice(0, 5) === time,
                              ),
                          ).length
                        }{" "}
                        boş saat
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {selectedTeacher && !isLoading && (
          <div>
            <button
              onClick={() => {
                setSelectedTeacher(null);
                closeModal();
              }}
              className="mb-4 text-sm text-blue-600 hover:underline"
            >
              Ögretmen listesine geri don
            </button>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow">
              <h2 className="mb-6 text-2xl font-semibold text-slate-800">
                {selectedTeacher.name} Programi
              </h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {timeSlots.map((time) => {
                  const lesson = teacherLessons.find(
                    (item) => item.start_time?.slice(0, 5) === time,
                  );

                  return (
                    <div
                      key={time}
                      className={`rounded-2xl border p-4 ${
                        lesson ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">{time}</span>
                        <span
                          className={`text-sm font-medium ${
                            lesson ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {lesson ? "Dolu" : "Bos"}
                        </span>
                      </div>

                      <div className="mt-3 text-sm text-slate-600">
                        {lesson ? (
                          <div>
                            <p>Bu saat icin ders kaydı bulunuyor.</p>

                            <button
                              onClick={() => deleteLesson(lesson.id)}
                              className="mt-2 text-red-600 hover:underline"
                            >
                              - Ders kaydını sil
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              setActiveSlot({
                                teacherId: selectedTeacher.id,
                                time,
                              })
                            }
                            className="text-blue-600 hover:underline"
                          >
                            + Ders ekle
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
 
        {successMessage && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}

      {activeSlot && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 p-4"
        onClick={closeModal}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-800">Öğrenci seç</h3>
            <p className="mt-2 text-sm text-slate-500">
              {selectedTeacher.name} ile {activeSlot.time} arasında ders yapacak öğrenciyi seçin veya yeni öğrenci ekleyin.
            </p>

            <select
              value={selectedStudentId ?? ""}
              onChange={(e) => setSelectedStudentId(e.target.value ? Number(e.target.value) : null)}
              className="mt-4 w-full rounded-xl border border-slate-300 px-3 py-2"
            >
              <option value="">Seç</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>

              
            <div className="mt-4 border-t pt-4">
              <p className="text-sm text-slate-500 mb-2">Yeni öğrenci ekle</p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="Öğrenci adı"
                  className="flex-1 rounded-xl border border-slate-300 px-3 py-2"
                />

                <button
                  onClick={createStudent}
                  className="bg-green-600 text-white px-4 rounded-xl"
                >
                  Ekle
                </button>
              </div>
            </div>

            <div 
            className="mt-6 flex justify-end"
            >
              <button
                onClick={closeModal}
                className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700"
              >
                Iptal
              </button>
              <span className="mx-2 text-sm text-slate-500">veya</span>
              <button
                disabled={!selectedStudentId}
                onClick={createLesson}
                className={`rounded-xl px-4 py-2 ${
                  selectedStudentId
                    ? "bg-blue-600 text-white"
                    : "cursor-not-allowed bg-slate-200 text-slate-500"
                }`}
              >
                {isSaving ? "Kaydediliyor..." : "Dersi Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
