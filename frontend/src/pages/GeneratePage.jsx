import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function GeneratePage() {
  const navigate = useNavigate();
  const [coursesFile, setCoursesFile] = useState(null);
  const [roomsFile, setRoomsFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!coursesFile || !roomsFile) {
      setError("Please select both files.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("courses", coursesFile);
    formData.append("rooms", roomsFile);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/generate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Generation failed");
      }

      // Auto-download the zip
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "timetables.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setSuccess("Timetables generated! Download started.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Generate Timetable</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:underline"
          >
            Logout
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded shadow-md"
        >
          {error && (
            <p className="text-red-600 text-sm mb-4">{error}</p>
          )}
          {success && (
            <p className="text-green-600 text-sm mb-4">{success}</p>
          )}

          <label className="block mb-2 text-sm font-medium">
            Courses File (.xlsx)
          </label>
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => setCoursesFile(e.target.files[0])}
            className="w-full border border-gray-300 rounded px-3 py-2 mb-4 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700"
          />

          <label className="block mb-2 text-sm font-medium">
            Rooms File (.xlsx)
          </label>
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => setRoomsFile(e.target.files[0])}
            className="w-full border border-gray-300 rounded px-3 py-2 mb-6 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate & Download"}
          </button>
        </form>
      </div>
    </div>
  );
}
