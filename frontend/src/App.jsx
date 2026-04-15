import React from "react";

export default function LessonFlowDashboard() {
  const [categories] = React.useState([
    "Dil ve Konuşma",
    "Ergoterapi",
    "Özel Eğitim",
    "Duyu Bütünleme",
    "Psikolog",
  ]);

  const [selectedCategory, setSelectedCategory] = React.useState(null);
  const [teachers, setTeachers] = React.useState([]);
  const [lessons, setLessons] = React.useState([]);
  const [selectedTeacher, setSelectedTeacher] = React.useState(null);

  React.useEffect(() => {
    async function loadData() {
      try {
        const teachersResponse = await fetch("http://localhost:3000/teachers");
        const teachersData = await teachersResponse.json();
        setTeachers(teachersData);

        await fetchLessons();
      } catch (err) {
        console.error("Veriler yüklenirken hata oluştu:", err);
      }
    }

    loadData();
  }, []);

  async function fetchLessons() {
    const res = await fetch("http://localhost:3000/lessons");
    const data = await res.json();
    setLessons(data);
  }

 function createLesson({ teacherId, time }) {
  fetch("http://localhost:3000/lessons", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      teacher_id: teacherId,
      student_id: 1,
      date: "2026-04-14",
      start_time: time,
      end_time: "11:00"
    })
  })
  .then((res) => {fetchLessons(); return res;})
  .then((res) => res.json())
  .then((data) => {
    console.log("ders oluşturuldu:", data);
  })
  .catch((err) => {
    console.error("hata:", err);
  });
}

  const teacherLessons = selectedTeacher
    ? lessons.filter((lesson) => lesson.teacher_id === selectedTeacher.id)
    : [];

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">LessonFlow</h1>
          <p className="text-slate-500 mt-2">
            Dersleri, öğretmenleri ve boş saatleri yönetin.
          </p>
        </div>

        {!selectedCategory && (
          <div>
            <h2 className="text-2xl font-semibold text-slate-700 mb-4">
              Dersler
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className="bg-white rounded-3xl p-6 shadow hover:shadow-lg transition text-left border border-slate-200"
                >
                  <h3 className="text-xl font-semibold text-slate-800">
                    {category}
                  </h3>
                  <p className="text-slate-500 mt-2">
                    Bu branştaki öğretmenleri ve boş saatleri görüntüle.
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedCategory && !selectedTeacher && (
          <div>
            <button
              onClick={() => setSelectedCategory(null)}
              className="mb-4 text-sm text-blue-600 hover:underline"
            >
              ← Derslere geri dön
            </button>

            <h2 className="text-2xl font-semibold text-slate-700 mb-4">
              {selectedCategory} Öğretmenleri
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {teachers.map((teacher) => {
                const teacherLessonCount = lessons.filter(
                  (lesson) => lesson.teacher_id === teacher.id
                ).length;

                return (
                  <button
                    key={teacher.id}
                    onClick={() => setSelectedTeacher(teacher)}
                    className="bg-white rounded-3xl p-6 shadow hover:shadow-lg transition text-left border border-slate-200"
                  >
                    <h3 className="text-xl font-semibold text-slate-800">
                      {teacher.name}
                    </h3>

                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                      <p>{teacherLessonCount} ders planlanmış</p>
                      <p>2 boş saat</p>
                      <p>1 telafi bekliyor</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {selectedTeacher && (
          <div>
            <button
              onClick={() => setSelectedTeacher(null)}
              className="mb-4 text-sm text-blue-600 hover:underline"
            >
              ← Öğretmen listesine geri dön
            </button>

            <div className="bg-white rounded-3xl shadow p-6 border border-slate-200">
              <h2 className="text-2xl font-semibold text-slate-800 mb-6">
                {selectedTeacher.name} Programı
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  "09:00",
                  "10:00",
                  "11:00",
                  "13:00",
                  "14:00",
                  "15:00",
                ].map((time) => {
                  const lesson = teacherLessons.find(
                    (item) => item.start_time?.slice(0, 5) === time
                  );

                  return (
                    <div
                      key={time}
                      className={`rounded-2xl p-4 border ${
                        lesson
                          ? "bg-red-50 border-red-200"
                          : "bg-green-50 border-green-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">
                          {time}
                        </span>

                        <span
                          className={`text-sm font-medium ${
                            lesson ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {lesson ? "Dolu" : "Boş"}
                        </span>
                      </div>

                      <div className="mt-3 text-sm text-slate-600">
                        {lesson ? (
                          <p>Bu saatte planlanmış bir ders var.</p>
                        ) : (
                          <button onClick={() => createLesson({
                            teacherId: selectedTeacher.id,
                            time: time,
                          })} className="text-blue-600 hover:underline">
                            + Yeni öğrenci / ders ekle
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
    </div>
  );
}
