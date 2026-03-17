import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api, authHeaders } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import Aim from "../components/experiment/Aim";
import ComponentsRequired from "../components/experiment/ComponentsRequired";
import Procedure from "../components/experiment/Procedure";
import Simulation from "../components/experiment/Simulation";
import Quiz from "../components/experiment/Quiz";
import { generateLabReportPdf } from "../utils/labReportPdf";

const ExperimentPage = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("aim");
    const [experiment, setExperiment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        const fetchExperiment = async () => {
            try {
                const config = { headers: authHeaders(user.token) };
                // Fetch classroom details which acts as the experiment definition
                const { data } = await api.get(`/api/classrooms/${id}`, config);

                // Transform data if necessary or use directly
                setExperiment({
                    id: data._id,
                    title: data.name,
                    aim: data.aim || "No aim provided.",
                    procedure: data.procedure && data.procedure.length > 0 ? data.procedure : ["No procedure provided."],
                    components: data.components || [],
                    quiz: data.quiz || [],
                    code: data.code // store code if needed
                });
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError("Failed to load experiment. " + (err.response?.data?.message || err.message));
                setLoading(false);
            }
        };

        if (user && id) {
            fetchExperiment();
        }
    }, [id, user]);

    if (loading) return <div className="text-center p-10">Loading experiment...</div>;
    if (error) return <div className="text-center p-10 text-red-500">{error}</div>;
    if (!experiment) return <div className="text-center p-10">Experiment not found</div>;

    const handleExportPdf = async () => {
        if (!user || !experiment) return;
        setExporting(true);
        try {
            const config = { headers: authHeaders(user.token) };
            const { data } = await api.get('/api/submissions/my', config);
            const sub = data.find(s =>
                (s.classroom?._id === experiment.id || s.classroom === experiment.id) ||
                s.experimentTitle === experiment.title
            );

            const doc = generateLabReportPdf({
                experiment,
                student: user,
                submission: sub || null,
            });
            doc.save(`lab-report-${(experiment.title || 'experiment').replace(/[^a-z0-9]+/gi, '_').toLowerCase()}.pdf`);
        } catch (e) {
            console.error(e);
            toast.error('Failed to export PDF');
        } finally {
            setExporting(false);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case "aim":
                return <Aim aim={experiment.aim} />;
            case "components":
                return <ComponentsRequired components={experiment.components} />;
            case "procedure":
                return <Procedure procedure={experiment.procedure} />;
            case "simulation":
                // experiment object passed here matches what Simulation expects (has title)
                return <Simulation experiment={experiment} />;
            case "quiz":
                return <Quiz questions={experiment.quiz} experimentTitle={experiment.title} classroomId={experiment.id} />;
            default:
                return <Aim aim={experiment.aim} />;
        }
    };

    return (
        <div className="min-h-screen text-slate-200 flex flex-col md:flex-row">
            {/* Sidebar needs to be updated or mocked if it relies on hardcoded indices */}
            {/* Assuming sidebar takes activeTab and setter, it should work fine */}
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="flex-grow p-4 lg:p-8 transition-all duration-300 md:ml-64">
                <div className="md:hidden glass-panel p-4 sticky top-4 z-20 flex justify-between items-center mb-6">
                    <h1 className="font-bold text-white truncate">{experiment.title}</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={handleExportPdf}
                            disabled={exporting}
                            className="text-xs bg-slate-800 px-3 py-1.5 rounded-lg text-slate-300 border border-slate-700 hover:text-white hover:border-slate-500 transition-colors disabled:opacity-60"
                        >
                            {exporting ? 'Exporting…' : 'Export PDF'}
                        </button>
                        <button
                            onClick={() => navigate("/student-dashboard")}
                            className="text-xs bg-slate-800 px-3 py-1.5 rounded-lg text-slate-300 border border-slate-700 hover:text-white hover:border-slate-500 transition-colors"
                        >
                            Exit
                        </button>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto">
                    <header className="mb-8 hidden md:block border-b border-slate-700/50 pb-6">
                        <div className="flex justify-between items-end">
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">{experiment.title}</h1>
                                <p className="text-slate-400 mt-2 flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs font-mono border border-blue-500/20">
                                        CODE: {experiment.code}
                                    </span>
                                </p>
                            </div>
                            <button
                                onClick={handleExportPdf}
                                disabled={exporting}
                                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 font-bold disabled:opacity-60"
                            >
                                {exporting ? 'Exporting…' : 'Export PDF'}
                            </button>
                        </div>
                    </header>

                    <main className="fade-in glass-panel p-6 min-h-[500px] border border-slate-700/50 relative overflow-hidden">
                        {renderContent()}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ExperimentPage;
