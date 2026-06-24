import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";

export default function AiTools() {
  const [nlpText, setNlpText] = useState("");
  const [faqQuestion, setFaqQuestion] = useState("");
  const [suggestionMessage, setSuggestionMessage] = useState("");

  const { data: status } = useQuery({ queryKey: ["ai-status"], queryFn: () => api.ai.status() });
  const { data: ventures } = useQuery({ queryKey: ["ventures"], queryFn: () => api.ventures.list() });
  const [selectedVentureId, setSelectedVentureId] = useState<number | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [nlpResult, setNlpResult] = useState<any>(null);
  const [faqResult, setFaqResult] = useState<any>(null);
  const [suggestionResult, setSuggestionResult] = useState<any>(null);
  const [roadmapResult, setRoadmapResult] = useState<any>(null);
  const [roadmapLock, setRoadmapLock] = useState("Run validation first. Roadmap unlocks when score is above 75.");

  const validateMutation = useMutation({
    mutationFn: (venture: any) => api.ai.validate(venture),
    onSuccess: (data) => {
      setValidationResult(data.result);
      setRoadmapLock(data.result.score > 75
        ? `Ready to generate a 90-day roadmap. Current score: ${data.result.score}.`
        : `Roadmap unlocks only when validation score is above 75. Current score: ${data.result.score}.`);
    },
  });

  const roadmapMutation = useMutation({
    mutationFn: ({ venture, score }: { venture: any; score: number }) => api.ai.roadmap(venture, score),
    onSuccess: (data) => setRoadmapResult(data.result),
  });

  const handleValidate = () => {
    const venture = ventures?.ventures?.find((v: any) => v.id === selectedVentureId);
    if (!venture) return;
    validateMutation.mutate(venture);
  };

  const handleRoadmap = () => {
    const venture = ventures?.ventures?.find((v: any) => v.id === selectedVentureId);
    if (!venture || !validationResult?.score || validationResult.score <= 75) return;
    roadmapMutation.mutate({ venture, score: validationResult.score });
  };

  const ventureList = ventures?.ventures || [];

  const renderResult = (result: any) => {
    if (!result) return null;
    return (
      <div className="mt-4 space-y-3">
        {Object.entries(result).map(([key, value]) => (
          <div key={key} className="rounded-lg border border-gray-800 border-l-4 border-l-green-500/50 bg-gray-900/30 p-4">
            <strong className="block text-sm font-bold uppercase tracking-wide text-white">{key.replace(/_/g, " ")}</strong>
            {Array.isArray(value) ? (
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-400">
                {value.map((item: string, i: number) => <li key={i}>{item}</li>)}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-gray-400">{String(value)}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6 border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-black text-white">AI Validation & Tools</h1>
        <p className="mt-1 text-sm text-gray-500">Validate ideas, analyze pitch language, ask questions, get suggestions, and generate roadmaps.</p>
      </div>

      {status && (
        <div className={`mb-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold ${
          status.enabled ? "bg-green-500/10 text-green-400" : "bg-gray-800 text-orange-400"
        }`}>
          {status.enabled ? `AI enabled — ${status.provider} (${status.model})` : "Idea validation is available locally."}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">AI Idea Validation</h2>
          <select onChange={e => setSelectedVentureId(Number(e.target.value))}
            className="mb-3 w-full rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm outline-none focus:border-orange-500">
            <option value="">Select a venture</option>
            {ventureList.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <button onClick={handleValidate} disabled={!selectedVentureId || validateMutation.isPending}
            className="rounded-lg bg-gradient-to-r from-orange-500 to-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50">
            {validateMutation.isPending ? "Validating..." : "Run Validation"}
          </button>
          {validateMutation.isError && <p className="mt-3 text-sm text-red-400">{(validateMutation.error as any).message}</p>}
          {renderResult(validationResult)}
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">NLP Market Signal Analyzer</h2>
          <textarea value={nlpText} onChange={e => setNlpText(e.target.value)} rows={4} placeholder="Paste your pitch, problem statement, or customer interview notes..."
            className="w-full rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm outline-none focus:border-orange-500" />
          <button onClick={async () => {
            if (!nlpText.trim()) return;
            const result = await api.ai.nlp(nlpText);
            setNlpResult(result.result);
          }} disabled={!nlpText.trim()}
            className="mt-2 rounded-lg border border-gray-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800 disabled:opacity-50">
            Analyze Language
          </button>
          {renderResult(nlpResult)}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">FAQ Bot</h2>
          <textarea value={faqQuestion} onChange={e => setFaqQuestion(e.target.value)} rows={3} placeholder="How do I find a mentor for a fintech venture?"
            className="w-full rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm outline-none focus:border-orange-500" />
          <button onClick={async () => {
            if (!faqQuestion.trim()) return;
            const result = await api.ai.faq(faqQuestion);
            setFaqResult(result.result);
          }} disabled={!faqQuestion.trim()}
            className="mt-2 rounded-lg border border-gray-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800 disabled:opacity-50">
            Ask FAQ Bot
          </button>
          {renderResult(faqResult)}
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Suggestion Chat</h2>
          <textarea value={suggestionMessage} onChange={e => setSuggestionMessage(e.target.value)} rows={3} placeholder="What should I validate before pitching investors?"
            className="w-full rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm outline-none focus:border-orange-500" />
          <button onClick={async () => {
            if (!suggestionMessage.trim() || !selectedVentureId) return;
            const venture = ventureList.find((v: any) => v.id === selectedVentureId);
            const result = await api.ai.suggestions(suggestionMessage, venture);
            setSuggestionResult(result.result);
          }} disabled={!suggestionMessage.trim() || !selectedVentureId}
            className="mt-2 rounded-lg border border-gray-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800 disabled:opacity-50">
            Get Suggestions
          </button>
          {renderResult(suggestionResult)}
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Roadmap Generator</h2>
          <p className="mb-3 text-xs text-gray-500">{roadmapLock}</p>
          <button onClick={handleRoadmap} disabled={!selectedVentureId || !validationResult?.score || validationResult.score <= 75 || roadmapMutation.isPending}
            className="rounded-lg bg-gradient-to-r from-orange-500 to-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50">
            {roadmapMutation.isPending ? "Generating..." : "Generate Roadmap"}
          </button>
          {renderResult(roadmapResult)}
        </div>
      </div>
    </div>
  );
}
