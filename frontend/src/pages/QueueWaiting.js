import { ref, onValue, remove } from "firebase/database";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { database } from "../config/firebaseConfig";

const QueueWaiting = () => {
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;

    const queueRef = ref(database, `queue/${userId}`);

    const unsubscribe = onValue(queueRef, (snapshot) => {
      const data = snapshot.val();
      if (data?.matchId) {
        remove(queueRef); // Clean up
        navigate(`/game/${data.matchId}`);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [userId, navigate]);

  const handleCancel = async () => {
    if (userId) {
      await remove(ref(database, `queue/${userId}`));
    }
    navigate("/lobby");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="text-center">
        <h2 className="text-xl mb-4">Waiting for another player...</h2>
        <p className="text-sm text-gray-400 mb-6">
          You will be redirected automatically once matched.
        </p>
        <button
          onClick={handleCancel}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default QueueWaiting;
