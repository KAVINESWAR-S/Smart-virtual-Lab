import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { api, authHeaders } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Simulator from '../experiment/Simulator/Simulator';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTimes, FaChalkboard, FaUsers, FaArrowRight, FaEdit, FaSave, FaClipboardList, FaFilePdf, FaTrash, FaLock } from 'react-icons/fa';

const TeacherDashboard = () => {
    const { user } = useAuth();
    const [classrooms, setClassrooms] = useState([]);

    // Create Classroom State
    const [isCreating, setIsCreating] = useState(false);
    const [newClassroom, setNewClassroom] = useState({
        name: '',
        aim: '',
        procedure: [''],
        components: [],
        quiz: [{ question: '', options: ['', '', '', ''], answer: '' }],
        dueAt: '',
        attemptLimit: '',
        simulationEnabled: true
    });

    // First Login Policy State
    const [showFirstLoginModal, setShowFirstLoginModal] = useState(user?.isFirstLogin || false);
    const [flCurrentPassword, setFlCurrentPassword] = useState('');
    const [flNewPassword, setFlNewPassword] = useState('');
    const [flConfirmPassword, setFlConfirmPassword] = useState('');

    // View/Grade State
    const [selectedClassroom, setSelectedClassroom] = useState(null);
    const [classroomDetails, setClassroomDetails] = useState(null);
    const [allClassroomSubmissions, setAllClassroomSubmissions] = useState([]); // Store all submissions for the class
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentSubmissions, setStudentSubmissions] = useState([]);
    const [gradeInput, setGradeInput] = useState('');
    const [feedbackInput, setFeedbackInput] = useState('');

    useEffect(() => {
        fetchClassrooms();
    }, []);

    const fetchClassrooms = async () => {
        try {
            const config = { headers: authHeaders(user.token) };
            const { data } = await api.get('/api/classrooms', config);
            setClassrooms(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleFirstLoginSubmit = async (e) => {
        e.preventDefault();
        if (flNewPassword !== flConfirmPassword) {
            return toast.error('New passwords do not match');
        }
        try {
            const config = {
                headers: { 'Content-Type': 'application/json', ...authHeaders(user.token) },
            };
            await api.post('/api/auth/change-password', { currentPassword: flCurrentPassword, newPassword: flNewPassword }, config);
            toast.success('Password updated successfully');
            setShowFirstLoginModal(false);
            if (user) user.isFirstLogin = false;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update password');
        }
    };

    // --- Creation Handlers ---
    // (Existing handlers reused for brevity/correctness, just wrapped in UI update)
    const handleProcedureChange = (index, value) => {
        const newProcedure = [...newClassroom.procedure];
        newProcedure[index] = value;
        setNewClassroom({ ...newClassroom, procedure: newProcedure });
    };

    const addProcedureStep = () => {
        setNewClassroom({ ...newClassroom, procedure: [...newClassroom.procedure, ''] });
    };

    const removeProcedureStep = (index) => {
        const newProcedure = [...newClassroom.procedure];
        newProcedure.splice(index, 1);
        setNewClassroom({ ...newClassroom, procedure: newProcedure });
    };

    const handleComponentChange = (index, value) => {
        const newComponents = [...newClassroom.components];
        newComponents[index] = value;
        setNewClassroom({ ...newClassroom, components: newComponents });
    };

    const addComponentStep = () => {
        setNewClassroom({ ...newClassroom, components: [...newClassroom.components, ''] });
    };

    const removeComponentStep = (index) => {
        const newComponents = [...newClassroom.components];
        newComponents.splice(index, 1);
        setNewClassroom({ ...newClassroom, components: newComponents });
    };

    const handleQuizChange = (index, field, value, optionIndex = null) => {
        const newQuiz = [...newClassroom.quiz];
        if (field === 'options') {
            newQuiz[index].options[optionIndex] = value;
        } else {
            newQuiz[index][field] = value;
        }
        setNewClassroom({ ...newClassroom, quiz: newQuiz });
    };

    const addQuizQuestion = () => {
        setNewClassroom({ ...newClassroom, quiz: [...newClassroom.quiz, { question: '', options: ['', '', '', ''], answer: '' }] });
    };

    const removeQuizQuestion = (index) => {
        if (newClassroom.quiz.length === 1) return;
        const newQuiz = [...newClassroom.quiz];
        newQuiz.splice(index, 1);
        setNewClassroom({ ...newClassroom, quiz: newQuiz });
    };

    const handlePdfUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('pdf', file);

        const uploadToast = toast.loading('Extracting data from PDF...');

        try {
            const config = {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    ...authHeaders(user.token) 
                },
            };
            const { data } = await api.post('/api/classrooms/extract-pdf', formData, config);
            
            // Use extracted data or fallback to what we already typed
            setNewClassroom(prev => ({
                ...prev,
                aim: data.aim || prev.aim,
                components: data.components.length > 0 ? data.components : prev.components,
                procedure: data.procedure.length > 0 ? data.procedure : prev.procedure
            }));
            
            toast.success('PDF Processed! Form auto-filled.', { id: uploadToast });
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to extract PDF', { id: uploadToast });
        }
    };

    const createClassroom = async (e) => {
        e.preventDefault();
        try {
            const config = {
                headers: { 'Content-Type': 'application/json', ...authHeaders(user.token) },
            };
            const payload = {
                ...newClassroom,
                dueAt: newClassroom.dueAt ? new Date(newClassroom.dueAt).toISOString() : null,
                attemptLimit: newClassroom.attemptLimit ? Number(newClassroom.attemptLimit) : null,
            };
            await api.post('/api/classrooms', payload, config);
            setIsCreating(false);
            setNewClassroom({
                name: '', aim: '', procedure: [''], components: [],
                quiz: [{ question: '', options: ['', '', '', ''], answer: '' }],
                dueAt: '',
                attemptLimit: '',
                simulationEnabled: true
            });
            fetchClassrooms();
            toast.success('Classroom created');
        } catch (error) {
            console.error("Experiment creation error:", error.response?.data || error);
            const errMsg = error.response?.data?.message || 'Failed to create classroom';
            toast.error(errMsg);
        }
    };

    // --- View/Grade Handlers ---
    const viewClassroom = async (id) => {
        try {
            const config = { headers: authHeaders(user.token) };
            const { data } = await api.get(`/api/classrooms/${id}`, config);
            setClassroomDetails(data);
            setSelectedClassroom(id);
            setSelectedStudent(null);

            // Fetch all submissions for this experiment to show in the table
            const subRes = await api.get(`/api/submissions?classroomId=${encodeURIComponent(data._id)}`, config);
            setAllClassroomSubmissions(subRes.data);
        } catch (error) { console.error(error); }
    };

    const handleViewSubmissions = async (student) => {
        setSelectedStudent(student);
        try {
            const config = { headers: authHeaders(user.token) };
            const { data } = await api.get(`/api/submissions/student/${student._id}`, config);
            const relevantSubmissions = data.filter(sub =>
                (sub.classroom?._id === classroomDetails._id || sub.classroom === classroomDetails._id) ||
                sub.experimentTitle === classroomDetails.name
            );
            setStudentSubmissions(relevantSubmissions);
        } catch (error) { console.error(error); }
    };

    const handleGradeSubmit = async (submissionId) => {
        try {
            const config = {
                headers: { 'Content-Type': 'application/json', ...authHeaders(user.token) },
            };
            await api.put(`/api/submissions/${submissionId}/grade`, {
                grade: gradeInput, feedback: feedbackInput
            }, config);

            // Re-fetch to show update
            const updatedSubmissions = studentSubmissions.map(sub =>
                sub._id === submissionId ? { ...sub, grade: gradeInput, feedback: feedbackInput } : sub
            );
            setStudentSubmissions(updatedSubmissions);
            toast.success('Graded');
        } catch (error) { console.error(error); toast.error('Failed to grade'); }
    };

    const getStudentQuizScore = (studentId) => {
        const sub = allClassroomSubmissions.find(s =>
            (s.student?._id === studentId || s.student === studentId)
        );
        const total = classroomDetails?.quiz?.length || 0;
        return sub && sub.quizScore != null ? `${sub.quizScore}/${total}` : 'N/A';
    };

    const getStudentSimulationScore = (studentId) => {
        const sub = allClassroomSubmissions.find(s =>
            (s.student?._id === studentId || s.student === studentId)
        );
        return sub && sub.simulationScore != null ? `${sub.simulationScore}/10` : 'N/A';
    };

    const getStudentAttemptsUsed = (studentId) => {
        const sub = allClassroomSubmissions.find(s =>
            (s.student?._id === studentId || s.student === studentId)
        );
        return sub && sub.attemptsUsed != null ? sub.attemptsUsed : 0;
    };

    const exportToCSV = () => {
        if (!classroomDetails || !classroomDetails.students) return;

        const headers = ["Student Name", "Email", "Quiz Score", "Manual Grade", "Attempts Used", "Feedback"];
        const rows = classroomDetails.students.map(student => {
            const sub = allClassroomSubmissions.find(s =>
                (s.student?._id === student._id || s.student === student._id)
            );

            const totalQuiz = classroomDetails.quiz?.length || 0;
            // Use 'X out of Y' format to prevent Excel from auto-converting to date (e.g. 5/10 -> 5-Oct)
            const quizScore = sub && sub.quizScore != null ? `"${sub.quizScore} out of ${totalQuiz}"` : '"N/A"';
            const grade = sub && sub.grade ? sub.grade : 'N/A';
            const attemptsUsed = sub && sub.attemptsUsed != null ? sub.attemptsUsed : 0;
            // Escape potential commas in feedback
            const feedback = sub && sub.feedback ? `"${sub.feedback.replace(/"/g, '""')}"` : '""';

            return [
                `"${student.name}"`,
                `"${student.email}"`,
                quizScore,
                grade,
                attemptsUsed,
                feedback
            ].join(",");
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${classroomDetails.name}_Grades.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen p-6 pt-24 text-white">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                            Teacher Command Center
                        </h1>
                        <p className="text-slate-400 text-lg">Manage experiments and student progress</p>
                    </div>
                </div>

                <AnimatePresence>
                    {!isCreating && !selectedClassroom && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-8"
                        >
                            <button
                                onClick={() => setIsCreating(true)}
                                className="w-full py-6 border-2 border-dashed border-slate-600 rounded-2xl text-slate-400 hover:text-white hover:border-blue-500 hover:bg-slate-800/50 transition-all flex flex-col items-center justify-center gap-2"
                            >
                                <FaPlus size={30} className="text-blue-500" />
                                <span className="font-bold text-lg">Create New Experiment Room</span>
                            </button>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {classrooms.map((room) => (
                                    <motion.div
                                        key={room._id}
                                        layoutId={room._id}
                                        className="glass-panel p-6 hover:shadow-2xl hover:shadow-purple-900/20 transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
                                                <FaChalkboard size={24} />
                                            </div>
                                            <span className="px-3 py-1 bg-slate-800 rounded-full text-xs font-mono border border-slate-700">
                                                {room.code}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-xl mb-2 group-hover:text-purple-300 transition-colors">{room.name}</h3>
                                        <div className="flex items-center text-slate-400 text-sm mb-6 gap-2">
                                            <FaUsers /> {room.students.length} Students
                                        </div>
                                        {(room.dueAt || room.attemptLimit) && (
                                            <div className="text-xs text-slate-400 mb-6 space-y-1">
                                                {room.dueAt && <div>Due: <span className="text-slate-200">{new Date(room.dueAt).toLocaleString()}</span></div>}
                                                {room.attemptLimit && <div>Attempts: <span className="text-slate-200">{room.attemptLimit}</span></div>}
                                            </div>
                                        )}
                                        <button
                                            onClick={() => viewClassroom(room._id)}
                                            className="btn-secondary w-full flex items-center justify-center gap-2 group-hover:bg-purple-600 group-hover:border-purple-500 transition-all"
                                        >
                                            Manage <FaArrowRight size={12} />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {isCreating && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="max-w-4xl mx-auto glass-panel p-8"
                        >
                            <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                                <h2 className="text-2xl font-bold">Design New Experiment</h2>
                                <div className="flex items-center gap-4">
                                    <label className="cursor-pointer bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 px-4 py-2 rounded-lg border border-purple-500/50 flex items-center gap-2 transition-all">
                                        <FaFilePdf /> Auto-Fill via PDF
                                        <input type="file" accept="application/pdf" className="hidden" onChange={handlePdfUpload} />
                                    </label>
                                    <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white">
                                        <FaTimes size={24} />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={createClassroom} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-slate-300">Experiment Name</label>
                                        <input
                                            type="text"
                                            className="glass-input w-full"
                                            placeholder="e.g. Ohm's Law Verification"
                                            value={newClassroom.name}
                                            onChange={(e) => setNewClassroom({ ...newClassroom, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-slate-300">Objective / Aim</label>
                                        <input
                                            type="text"
                                            className="glass-input w-full"
                                            placeholder="What will students learn?"
                                            value={newClassroom.aim}
                                            onChange={(e) => setNewClassroom({ ...newClassroom, aim: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-pink-400 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]">Due Date (optional)</label>
                                        <input
                                            type="datetime-local"
                                            className="w-full bg-slate-950 border-2 border-purple-500 focus:border-pink-500 text-pink-300 p-3 rounded-lg font-bold shadow-[0_0_15px_rgba(168,85,247,0.4)] focus:shadow-[0_0_20px_rgba(236,72,153,0.6)] outline-none transition-all"
                                            style={{ colorScheme: "dark" }}
                                            value={newClassroom.dueAt}
                                            onChange={(e) => setNewClassroom({ ...newClassroom, dueAt: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-slate-300">Attempt Limit (optional)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="glass-input w-full"
                                            placeholder="e.g. 3"
                                            value={newClassroom.attemptLimit}
                                            onChange={(e) => setNewClassroom({ ...newClassroom, attemptLimit: e.target.value })}
                                        />
                                        <p className="text-xs text-slate-500 mt-2">
                                            Counts when a student re-submits a quiz or simulation after already submitting once.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-slate-300">Components Required</label>
                                        <div className="space-y-2">
                                            {newClassroom.components.map((comp, index) => (
                                                <div key={index} className="flex gap-2">
                                                    <span className="p-3 text-slate-500 font-mono text-sm">•</span>
                                                    <input
                                                        type="text"
                                                        className="glass-input w-full"
                                                        placeholder="e.g. 10k Resistor"
                                                        value={comp}
                                                        onChange={(e) => handleComponentChange(index, e.target.value)}
                                                        required
                                                    />
                                                    <button type="button" onClick={() => removeComponentStep(index)} className="text-slate-500 hover:text-red-400 px-2 transition-colors">
                                                        <FaTimes />
                                                    </button>
                                                </div>
                                            ))}
                                            {newClassroom.components.length === 0 && (
                                                <p className="text-sm text-slate-500 italic mb-2">No components added yet.</p>
                                            )}
                                        </div>
                                        <button type="button" onClick={addComponentStep} className="mt-2 text-emerald-400 text-sm hover:text-emerald-300 font-semibold flex items-center gap-1">
                                            <FaPlus size={10} /> Add Component
                                        </button>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-slate-300">Procedure Steps</label>
                                        <div className="space-y-2">
                                            {newClassroom.procedure.map((step, index) => (
                                                <div key={index} className="flex gap-2 items-start">
                                                    <span className="p-3 text-slate-500 font-mono text-sm min-w-[30px]">{index + 1}.</span>
                                                    <textarea
                                                        className="glass-input w-full min-h-[50px] resize-y"
                                                        placeholder="Enter step..."
                                                        value={step}
                                                        onChange={(e) => handleProcedureChange(index, e.target.value)}
                                                        required
                                                    />
                                                    <button type="button" onClick={() => removeProcedureStep(index)} className="text-slate-500 hover:text-red-400 px-2 mt-3 transition-colors">
                                                        <FaTimes />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <button type="button" onClick={addProcedureStep} className="mt-2 text-blue-400 text-sm hover:text-blue-300 font-semibold flex items-center gap-1">
                                            <FaPlus size={10} /> Add Step
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700/50">
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="block text-sm font-bold text-slate-300">Quiz Configuration</label>
                                        <button type="button" onClick={addQuizQuestion} className="text-blue-400 text-sm hover:text-blue-300 font-semibold">
                                            + Add Question
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {newClassroom.quiz.map((q, qIndex) => (
                                            <div key={qIndex} className="bg-slate-950 p-4 rounded-lg border border-slate-800 relative group">
                                                {newClassroom.quiz.length > 1 && (
                                                    <button type="button" onClick={() => removeQuizQuestion(qIndex)} className="absolute top-4 right-4 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100" title="Delete Question">
                                                        <FaTrash size={14} />
                                                    </button>
                                                )}
                                                <input
                                                    type="text"
                                                    placeholder={`Question ${qIndex + 1}`}
                                                    className="glass-input w-full mb-3 pr-10"
                                                    value={q.question}
                                                    onChange={(e) => handleQuizChange(qIndex, 'question', e.target.value)}
                                                    required
                                                />
                                                <div className="grid grid-cols-2 gap-3 mb-3">
                                                    {q.options.map((opt, optIndex) => (
                                                        <input
                                                            key={optIndex}
                                                            type="text"
                                                            placeholder={`Option ${optIndex + 1}`}
                                                            className="glass-input w-full text-sm"
                                                            value={opt}
                                                            onChange={(e) => handleQuizChange(qIndex, 'options', e.target.value, optIndex)}
                                                            required
                                                        />
                                                    ))}
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Correct Answer (Exact Match)"
                                                    className="glass-input w-full border-green-900/50 focus:border-green-500"
                                                    value={q.answer}
                                                    onChange={(e) => handleQuizChange(qIndex, 'answer', e.target.value)}
                                                    required
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button type="submit" className="btn-primary py-3 px-8 text-lg">
                                        Publish Classroom
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}

                    {selectedClassroom && classroomDetails && !isCreating && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <button onClick={() => setSelectedClassroom(null)} className="mb-6 text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
                                ← Back to Dashboard
                            </button>

                            <div className="glass-panel p-6 mb-8">
                                <h2 className="text-3xl font-bold mb-2">{classroomDetails.name}</h2>
                                <p className="text-slate-400">Class Code: <span className="font-mono text-white bg-slate-800 px-2 py-1 rounded">{classroomDetails.code}</span></p>
                            </div>

                            <div className="glass-panel overflow-hidden">
                                <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
                                    <h3 className="font-bold text-xl">Student Roster</h3>
                                    <button
                                        onClick={exportToCSV}
                                        className="text-emerald-400 hover:text-emerald-300 font-medium text-sm border border-emerald-500/30 px-3 py-1 rounded hover:bg-emerald-500/10 transition-all flex items-center gap-2"
                                    >
                                        <FaClipboardList /> Export Grades
                                    </button>
                                </div>
                                <table className="w-full text-left">
                                    <thead className="bg-slate-900/50 text-slate-400 uppercase text-xs">
                                        <tr>
                                            <th className="p-4">Student Name</th>
                                            <th className="p-4">Email</th>
                                            <th className="p-4">Quiz Score</th>
                                            <th className="p-4">Attempts</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {classroomDetails.students.map(student => (
                                            <tr key={student._id} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="p-4 font-medium text-white">{student.name}</td>
                                                <td className="p-4 text-slate-400">{student.email}</td>
                                                <td className="p-4 font-mono text-blue-400">{getStudentQuizScore(student._id)}</td>
                                                <td className="p-4 font-mono text-slate-300">{getStudentAttemptsUsed(student._id)}</td>
                                                <td className="p-4 text-right">
                                                    <button
                                                        className="text-blue-400 hover:text-blue-300 font-medium text-sm border border-blue-500/30 px-3 py-1 rounded hover:bg-blue-500/10 transition-all"
                                                        onClick={() => handleViewSubmissions(student)}
                                                    >
                                                        View Data
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Full Screen Grading Modal */}
                {selectedStudent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex justify-center items-center z-50 p-4"
                    >
                        <div className="bg-slate-900 w-full max-w-7xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-700">
                            <div className="p-4 bg-slate-800/50 border-b border-slate-700 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Reviewing: {selectedStudent.name}</h2>
                                    <p className="text-xs text-slate-400">Experiment: {classroomDetails?.name}</p>
                                </div>
                                <button
                                    className="p-2 hover:bg-slate-700 rounded-full transition-colors"
                                    onClick={() => setSelectedStudent(null)}
                                >
                                    <FaTimes size={20} />
                                </button>
                            </div>

                            <div className="flex-grow overflow-y-auto p-6 bg-slate-950/50">
                                {studentSubmissions.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                        <FaChalkboard size={48} className="mb-4 opacity-20" />
                                        <p>No submissions found for this experiment.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-12">
                                        {studentSubmissions.map(sub => (
                                            <div key={sub._id} className="space-y-4">
                                                <div className="flex justify-between items-end border-b border-slate-800 pb-2">
                                                    <h3 className="font-bold text-lg text-blue-400">Submission @ {new Date(sub.submittedAt).toLocaleTimeString()}</h3>
                                                    <span className={`text-sm ${sub.grade ? 'text-green-400' : 'text-yellow-400'}`}>
                                                        Current Grade: {sub.grade ?? 'Pending'}
                                                    </span>
                                                </div>

                                                {/* Circuit Display */}
                                                <div className="h-[500px] border border-slate-700 rounded-lg overflow-hidden relative bg-slate-900">
                                                    {sub.circuitData && sub.circuitData.nodes ? (
                                                        <Simulator
                                                            initialNodes={sub.circuitData.nodes || []}
                                                            initialEdges={sub.circuitData.edges || []}
                                                            readOnly={true}
                                                        />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full text-slate-600">No Circuit Data</div>
                                                    )}
                                                </div>

                                                {/* Grade Form */}
                                                <div className="glass-panel p-4 flex gap-4 items-end">
                                                    <div className="w-32">
                                                        <label className="block text-xs font-bold text-slate-400 mb-1">Grade (0-10)</label>
                                                        <input
                                                            type="number"
                                                            className="glass-input w-full text-center font-bold text-xl"
                                                            defaultValue={sub.grade}
                                                            onChange={(e) => setGradeInput(e.target.value)}
                                                            min="0" max="10"
                                                        />
                                                    </div>
                                                    <div className="flex-grow">
                                                        <label className="block text-xs font-bold text-slate-400 mb-1">Feedback / Comments</label>
                                                        <input
                                                            type="text"
                                                            className="glass-input w-full"
                                                            defaultValue={sub.feedback}
                                                            placeholder="Great job! maybe check the voltage..."
                                                            onChange={(e) => setFeedbackInput(e.target.value)}
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setGradeInput(document.querySelector(`input[type="number"]`).value);
                                                            handleGradeSubmit(sub._id)
                                                        }}
                                                        className="btn-primary h-[50px] px-8 flex items-center gap-2"
                                                    >
                                                        <FaSave /> Save Grade
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* First Login Forced Modal */}
                {showFirstLoginModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex justify-center items-center z-[200] p-4"
                    >
                        <div className="bg-slate-900 w-full max-w-md p-8 rounded-2xl shadow-2xl border border-purple-500/50">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FaLock size={30} />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Welcome, Teacher!</h2>
                                <p className="text-slate-400 text-sm">For security reasons, please change your password before accessing the dashboard.</p>
                            </div>
                            <form onSubmit={handleFirstLoginSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Current Password (provided by Admin)</label>
                                    <input
                                        type="password"
                                        className="glass-input w-full"
                                        value={flCurrentPassword}
                                        onChange={(e) => setFlCurrentPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">New Password</label>
                                    <input
                                        type="password"
                                        className="glass-input w-full"
                                        value={flNewPassword}
                                        onChange={(e) => setFlNewPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Confirm New Password</label>
                                    <input
                                        type="password"
                                        className="glass-input w-full"
                                        value={flConfirmPassword}
                                        onChange={(e) => setFlConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <button type="submit" className="w-full btn-primary py-3 mt-4 bg-purple-600 hover:bg-purple-700 hover:shadow-purple-500/25">
                                    Update Password & Continue
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default TeacherDashboard;
