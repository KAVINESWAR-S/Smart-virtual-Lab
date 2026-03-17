import { useState } from "react";
import toast from 'react-hot-toast';
import { api, authHeaders } from '../../api/client';
import { useAuth } from "../../context/AuthContext";

const Quiz = ({ questions, experimentTitle, classroomId }) => {
    // const { id } = useParams(); // Removed
    // const experiment = experimentsData[id]; // Removed
    const { user } = useAuth();

    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [serverLoading, setServerLoading] = useState(false);

    // Initial check just to see if already done? 
    // Ideally we should check with backend if quiz already submitted, 
    // but for now let's just handle the submission part.

    const handleOptionSelect = (questionIndex, option) => {
        if (submitted) return;
        setAnswers({
            ...answers,
            [questionIndex]: option,
        });
    };

    const handleSubmit = async () => {
        let newScore = 0;
        questions.forEach((q, index) => {
            if (answers[index] === q.answer) {
                newScore += 1;
            }
        });
        setScore(newScore);

        // Save to backend
        if (user && user.role === 'student' && (classroomId || experimentTitle)) {
            setServerLoading(true);
            try {
                const config = {
                    headers: {
                        'Content-Type': 'application/json',
                        ...authHeaders(user.token)
                    },
                };
                const payload = {
                    classroomId: classroomId,
                    experimentTitle: experimentTitle,
                    quizScore: newScore
                };
                await api.post('/api/submissions', payload, config);
                toast.success('Quiz score saved');
            } catch (error) {
                console.error(error);
                toast.error(error.response?.data?.message || 'Failed to save quiz score');
            } finally {
                setServerLoading(false);
            }
        }

        setSubmitted(true);
    };



    return (
        <div className="glass-panel p-6 rounded-xl border border-slate-700/50">
            <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-700 pb-2">Quiz</h2>

            {!submitted ? (
                <div className="space-y-6">
                    {questions.map((q, index) => (
                        <div key={index} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                            <p className="font-semibold text-slate-200 mb-3">{index + 1}. {q.question}</p>
                            <div className="space-y-2">
                                {q.options.map((option, optIndex) => (
                                    <label
                                        key={optIndex}
                                        className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer border transition-all ${answers[index] === option
                                            ? "bg-blue-600/20 border-blue-500/50"
                                            : "border-transparent hover:bg-slate-700/50"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name={`q-${index}`}
                                            value={option}
                                            checked={answers[index] === option}
                                            onChange={() => handleOptionSelect(index, option)}
                                            className="text-blue-500 focus:ring-blue-500 bg-slate-900 border-slate-600"
                                        />
                                        <span className="text-slate-300">{option}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={handleSubmit}
                        disabled={Object.keys(answers).length < questions.length || serverLoading}
                        className={`w-full py-3 rounded-lg text-white font-semibold transition ${Object.keys(answers).length < questions.length || serverLoading
                            ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-500 shadow-lg shadow-green-900/20"
                            }`}
                    >
                        {serverLoading ? "Submitting..." : "Submit Quiz"}
                    </button>
                </div>
            ) : (
                <div className="text-center py-10">
                    <h3 className="text-3xl font-bold text-white mb-4">Quiz Completed!</h3>
                    <p className="text-xl text-slate-400 mb-6">
                        You scored <span className="text-blue-400 font-bold">{score}</span> out of <span className="text-white">{questions.length}</span>
                    </p>

                    <div className="w-full h-4 bg-slate-700 rounded-full mb-8 overflow-hidden max-w-md mx-auto">
                        <div
                            className={`h-full ${score >= 7 ? 'bg-green-500' : score >= 4 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${(score / questions.length) * 100}%` }}
                        ></div>
                    </div>

                    {/* Retry button removed as per requirement */}
                </div>
            )}
        </div>
    );
};

export default Quiz;    