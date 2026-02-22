import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/firebase';
import {
    collection, addDoc, getDocs,
    serverTimestamp, query, where
} from 'firebase/firestore';
import {
    Brain, Loader, AlertTriangle, CheckCircle2,
    Save, FileText, ClipboardList, Info
} from 'lucide-react';

// ─── Accurate age calculation (accounts for birthday not yet passed) ──────────
const calculateAge = (dob) => {
    if (!dob) return 'Unknown';
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const hasBirthdayPassed =
        today.getMonth() > birth.getMonth() ||
        (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
    if (!hasBirthdayPassed) age -= 1;
    return String(age);
};

// ─── Rule-Based Fallback Generator ────────────────────────────────────────────
const generateRuleBasedSummary = (data) => {
    const {
        patientName, age, gender, admissionDate, dischargeDate,
        diagnosis, treatmentGiven, labResults, medications, followUpInstructions
    } = data;

    const medList = medications
        ? medications.split(',').map(m => m.trim()).filter(Boolean)
        : [];

    return {
        summary: `${patientName} (${age} year old ${gender}) was admitted on ${admissionDate} and discharged on ${dischargeDate}. ` +
            `The patient presented with ${diagnosis}. Following appropriate treatment, the patient has been discharged in stable condition.`,
        diagnosis: diagnosis || 'As documented by treating physician.',
        treatment: treatmentGiven || 'Treatment administered as per clinical protocol.',
        medications: medList.length > 0 ? medList : ['As prescribed — please refer to the prescription sheet.'],
        advice: `Precautions & Warnings:\n- Maintain adequate rest and hydration.\n- Avoid strenuous activities or heavy lifting until follow-up visit.\n- Seek immediate emergency care if symptoms severely worsen.\n\nDietary Guidelines:\n- Follow a balanced, easily digestible diet.\n- Stay well-hydrated.\n\nLifestyle Modifications:\n- Ensure minimum 8 hours of sleep.`,
        followUp: followUpInstructions || 'Follow up with your treating physician within 7 days of discharge.',
        labHighlights: labResults || 'Refer to attached lab reports.',
        isAiGenerated: false,
    };
};

// ─── Main Component ────────────────────────────────────────────────────────────
const ReportGenerator = () => {
    const { currentUser, userProfile } = useAuth();
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState('');
    const [form, setForm] = useState({
        admissionDate: '',
        dischargeDate: '',
        diagnosis: '',
        treatmentGiven: '',
        labResults: '',
        medications: '',
        followUpInstructions: '',
    });
    const [generatedReport, setGeneratedReport] = useState(null);
    const [editedContent, setEditedContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [fallbackWarning, setFallbackWarning] = useState(false);
    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

    useEffect(() => {
        const fetchPatients = async () => {
            if (!currentUser) return;
            try {
                const q = query(collection(db, 'patients'), where('assignedDoctorId', '==', currentUser.uid));
                const snap = await getDocs(q);
                setPatients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (err) {
                console.error('Failed to load patients:', err);
            }
        };
        fetchPatients();
    }, [currentUser]);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    /* --- GEMINI API COMMENTED OUT ---
    const callGeminiAPI = async (promptData) => {
        if (!geminiApiKey) throw new Error('No API key');

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
        const patient = patients.find(p => p.id === selectedPatient);

        const prompt = `You are an expert senior medical professional preparing an official hospital discharge summary.
Generate ONLY based on the provided data. Do NOT invent, hallucinate, or add any clinical information not present in the input.
Your language should be professional, clear, and empathetic. Provide highly detailed and practical post-discharge instructions.

Return a valid JSON object with these exact keys:
1. summary: A professional medical summary of the admission.
2. diagnosis: The primary and secondary diagnoses.
3. treatment: The treatment administered during the hospital stay.
4. medications: An array of strings detailing medications (name, dosage, frequency).
5. advice: Detailed post-discharge advice. MUST include specific sub-sections for "Precautions & Warnings", "Dietary Guidelines", and "Lifestyle Modifications".
6. followUp: Specific instructions for follow-up appointments or tests.
7. labHighlights: Key takeaways from the lab results.

Patient Data:
${JSON.stringify({
            patientName: `${patient?.firstName} ${patient?.lastName}`,
            age: calculateAge(patient?.dob),
            gender: patient?.gender,
            ...promptData
        }, null, 2)}

Return ONLY valid JSON. No markdown fences. No extra text.`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
            }),
        });

        if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        return { ...JSON.parse(text), isAiGenerated: true };
    };
    */

    // --- OLLAMA API INTEGRATION ---
    const callOllamaAPI = async (promptData) => {
        const url = 'http://localhost:11434/api/generate';
        const patient = patients.find(p => p.id === selectedPatient);

        const prompt = `You are an expert senior medical professional preparing an official hospital discharge summary.
Generate ONLY based on the provided data. Do NOT invent, hallucinate, or add any clinical information not present in the input.
Your language should be professional, clear, and empathetic. Provide highly detailed and practical post-discharge instructions.

Return a valid JSON object with these exact keys:
1. summary: A professional medical summary of the admission.
2. diagnosis: The primary and secondary diagnoses.
3. treatment: The treatment administered during the hospital stay.
4. medications: An array of strings detailing medications (name, dosage, frequency).
5. advice: Detailed post-discharge advice. MUST include specific sub-sections for "Precautions & Warnings", "Dietary Guidelines", and "Lifestyle Modifications".
6. followUp: Specific instructions for follow-up appointments or tests.
7. labHighlights: Key takeaways from the lab results.

Patient Data:
${JSON.stringify({
            patientName: `${patient?.firstName} ${patient?.lastName}`,
            age: calculateAge(patient?.dob),
            gender: patient?.gender,
            ...promptData
        }, null, 2)}

Return ONLY valid JSON. No markdown fences. No extra text.`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'gemma:2b',
                prompt: prompt,
                stream: false,
                format: 'json',
                options: { temperature: 0.1 }
            }),
        });

        if (!response.ok) throw new Error(`Ollama API error: ${response.status}`);
        const data = await response.json();
        const text = data.response;
        return { ...JSON.parse(text), isAiGenerated: true };
    };

    const handleGenerate = async () => {
        if (!selectedPatient) { setError('Please select a patient.'); return; }
        if (!form.diagnosis.trim()) { setError('Diagnosis is required.'); return; }

        // Date validation
        if (form.admissionDate && form.dischargeDate && form.dischargeDate < form.admissionDate) {
            setError('Discharge date cannot be before admission date.');
            return;
        }

        setError('');
        setLoading(true);
        setFallbackWarning(false);

        const patient = patients.find(p => p.id === selectedPatient);
        const promptData = {
            admissionDate: form.admissionDate,
            dischargeDate: form.dischargeDate,
            diagnosis: form.diagnosis,
            treatmentGiven: form.treatmentGiven,
            labResults: form.labResults,
            medications: form.medications,
            followUpInstructions: form.followUpInstructions,
        };

        let report;
        try {
            try {
                // report = await callGeminiAPI(promptData);
                report = await callOllamaAPI(promptData);
            } catch (aiErr) {
                console.warn('AI unavailable, using rule-based fallback:', aiErr.message);
                setFallbackWarning(true);
                report = generateRuleBasedSummary({
                    patientName: `${patient?.firstName} ${patient?.lastName}`,
                    age: calculateAge(patient?.dob),
                    gender: patient?.gender || 'Unknown',
                    ...promptData,
                });
            }

            setGeneratedReport(report);

            const formatSection = (data) => {
                if (!data) return '—';
                if (typeof data === 'string') return data;
                if (Array.isArray(data)) return data.map((item, i) => `${i + 1}. ${item}`).join('\n');
                if (typeof data === 'object') {
                    return Object.entries(data)
                        .map(([key, value]) => {
                            const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                            return `${formattedKey}:\n${Array.isArray(value) ? value.map(v => `- ${v}`).join('\n') : value}`;
                        })
                        .join('\n\n');
                }
                return String(data);
            };

            setEditedContent(
                `DISCHARGE SUMMARY\n\nSUMMARY\n${formatSection(report.summary)}\n\nDIAGNOSIS\n${formatSection(report.diagnosis)}\n\nTREATMENT\n${formatSection(report.treatment)}\n\nMEDICATIONS\n${formatSection(report.medications)}\n\nLAB HIGHLIGHTS\n${formatSection(report.labHighlights)}\n\nADVICE\n${formatSection(report.advice)}\n\nFOLLOW-UP\n${formatSection(report.followUp)}`
            );
        } catch (unexpectedErr) {
            console.error('Unexpected error generating report:', unexpectedErr);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (status = 'draft') => {
        if (!generatedReport || !selectedPatient) return;
        setSaving(true);
        setError('');
        try {
            const reportRef = await addDoc(collection(db, 'reports'), {
                patientId: selectedPatient,
                doctorId: currentUser.uid,
                status,
                admissionDate: form.admissionDate,
                dischargeDate: form.dischargeDate,
                isAiGenerated: generatedReport.isAiGenerated,
                generatedContent: generatedReport,
                finalContent: editedContent,
                versionHistory: [{
                    content: editedContent,
                    savedAt: new Date().toISOString(),
                    savedBy: currentUser.uid,
                }],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            await addDoc(collection(db, 'auditLogs'), {
                userId: currentUser.uid,
                action: 'GENERATE_REPORT',
                resourceId: reportRef.id,
                details: `Report generated (${generatedReport.isAiGenerated ? 'AI' : 'Rule-Based'}) for patient ${selectedPatient}`,
                timestamp: serverTimestamp(),
            });

            setSuccess(`Report saved as "${status}" successfully!`);
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError('Failed to save report. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <Brain className="w-5 h-5 text-brand-400" />
                    AI Discharge Report Generator
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                    Generate professional discharge summaries with Gemini AI.
                    Falls back to rule-based generation if AI is offline.
                </p>
            </div>

            {error && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}
            {success && (
                <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3">
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                    <p className="text-green-400 text-sm">{success}</p>
                </div>
            )}
            {fallbackWarning && (
                <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-3">
                    <Info className="w-4 h-4 text-yellow-400 shrink-0" />
                    <div>
                        <p className="text-yellow-400 text-sm font-medium">[RULE-BASED SUMMARY] AI Unreachable</p>
                        <p className="text-yellow-500/70 text-xs mt-0.5">The Gemini API was unavailable. This summary was generated using a deterministic rule-based template. Please review carefully before approving.</p>
                    </div>
                </div>
            )}

            {/* Input Form */}
            <div className="card space-y-4">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-brand-400" />
                    Patient &amp; Clinical Details
                </h2>

                {/* Patient Select */}
                <div>
                    <label className="label">Select Patient *</label>
                    <select
                        value={selectedPatient}
                        onChange={e => setSelectedPatient(e.target.value)}
                        className="input"
                    >
                        <option value="">-- Choose a patient --</option>
                        {patients.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.firstName} {p.lastName} · {p.gender} · {p.bloodGroup}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className="label">Admission Date</label>
                        <input type="date" name="admissionDate" value={form.admissionDate} onChange={handleChange} className="input" />
                    </div>
                    <div>
                        <label className="label">Discharge Date</label>
                        <input
                            type="date"
                            name="dischargeDate"
                            value={form.dischargeDate}
                            onChange={handleChange}
                            min={form.admissionDate || undefined}
                            className="input"
                        />
                    </div>
                </div>

                <div>
                    <label className="label">Diagnosis *</label>
                    <textarea name="diagnosis" value={form.diagnosis} onChange={handleChange} rows={2} className="input resize-none" placeholder="Primary and secondary diagnoses..." />
                </div>
                <div>
                    <label className="label">Treatment Given</label>
                    <textarea name="treatmentGiven" value={form.treatmentGiven} onChange={handleChange} rows={2} className="input resize-none" placeholder="Surgeries, procedures, therapies..." />
                </div>
                <div>
                    <label className="label">Lab Results</label>
                    <textarea name="labResults" value={form.labResults} onChange={handleChange} rows={2} className="input resize-none" placeholder="Key lab findings..." />
                </div>
                <div>
                    <label className="label">Medications (comma-separated)</label>
                    <textarea name="medications" value={form.medications} onChange={handleChange} rows={2} className="input resize-none" placeholder="Amoxicillin 500mg BD, Pantoprazole 40mg OD..." />
                </div>
                <div>
                    <label className="label">Follow-Up Instructions</label>
                    <textarea name="followUpInstructions" value={form.followUpInstructions} onChange={handleChange} rows={2} className="input resize-none" placeholder="Visit cardiologist in 2 weeks, avoid driving..." />
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="btn-primary w-full justify-center"
                >
                    {loading ? (
                        <><Loader className="w-4 h-4 animate-spin" /> Generating Summary...</>
                    ) : (
                        <><Brain className="w-4 h-4" /> Generate Discharge Summary</>
                    )}
                </button>
            </div>

            {/* Generated Report */}
            {generatedReport && (
                <div className="card space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                            <FileText className="w-4 h-4 text-brand-400" />
                            Generated Summary
                            {generatedReport.isAiGenerated ? (
                                <span className="badge-blue"><Brain className="w-3 h-3" />AI Generated</span>
                            ) : (
                                <span className="badge-yellow"><Info className="w-3 h-3" />Rule-Based</span>
                            )}
                        </h2>
                    </div>

                    <div>
                        <label className="label">Edit Summary</label>
                        <textarea
                            value={editedContent}
                            onChange={e => setEditedContent(e.target.value)}
                            rows={18}
                            className="input font-mono text-xs leading-relaxed resize-y"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={() => handleSave('draft')} disabled={saving} className="btn-secondary flex-1 justify-center">
                            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save as Draft
                        </button>
                        <button onClick={() => handleSave('approved')} disabled={saving} className="btn-primary flex-1 justify-center">
                            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Approve Report
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportGenerator;
