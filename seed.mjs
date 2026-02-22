// seed.mjs — Run with: node seed.mjs
// Seeds Firebase with demo accounts and data for all roles

import { initializeApp } from 'firebase/app';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from 'firebase/auth';
import {
    getFirestore,
    doc,
    setDoc,
    addDoc,
    collection,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';


// Add your Credentials

const firebaseConfig = {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Helper: create or sign-in user
async function ensureUser(email, password, profile) {
    let uid;
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        uid = cred.user.uid;
        console.log(`✅ Created auth: ${email}`);
    } catch (e) {
        if (e.code === 'auth/email-already-in-use') {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            uid = cred.user.uid;
            console.log(`⚠️  Already exists (using): ${email}`);
        } else {
            throw e;
        }
    }
    await setDoc(doc(db, 'users', uid), {
        uid,
        email,
        disabled: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...profile,
    }, { merge: true });
    return uid;
}

async function seed() {
    console.log('\n🌱 Seeding MediDischarge Firebase...\n');

    // ── 1. Create users ─────────────────────────────────────────────
    const adminId = await ensureUser('admin@hospital.com', 'admin123', {
        firstName: 'System',
        lastName: 'Admin',
        role: 'admin',
        department: 'Administration',
    });

    const doctorId = await ensureUser('doctor@hospital.com', 'doctor123', {
        firstName: 'Arjun',
        lastName: 'Mehta',
        role: 'doctor',
        specialization: 'Cardiology',
        department: 'Cardiology',
    });

    const nurseId = await ensureUser('nurse@hospital.com', 'nurse123', {
        firstName: 'Priya',
        lastName: 'Sharma',
        role: 'nurse',
        department: 'ICU',
    });

    const patientUserId = await ensureUser('patient@hospital.com', 'patient123', {
        firstName: 'Ravi',
        lastName: 'Kumar',
        role: 'patient',
    });

    // ── 2. Create patient records ───────────────────────────────────
    const p1Ref = await addDoc(collection(db, 'patients'), {
        uid: patientUserId,
        firstName: 'Ravi',
        lastName: 'Kumar',
        dob: '1980-05-14',
        gender: 'Male',
        bloodGroup: 'O+',
        phone: '+91 9876543210',
        address: '12, MG Road, Bangalore',
        assignedDoctorId: doctorId,
        emergencyContact: 'Sunita Kumar — +91 9876543211',
        createdAt: serverTimestamp(),
    });
    console.log(`✅ Patient record: Ravi Kumar (${p1Ref.id})`);

    const p2Ref = await addDoc(collection(db, 'patients'), {
        uid: null,
        firstName: 'Ananya',
        lastName: 'Singh',
        dob: '1995-09-22',
        gender: 'Female',
        bloodGroup: 'B+',
        phone: '+91 9123456789',
        address: '45, Nehru Nagar, Delhi',
        assignedDoctorId: doctorId,
        emergencyContact: 'Rakesh Singh — +91 9123456780',
        createdAt: serverTimestamp(),
    });
    console.log(`✅ Patient record: Ananya Singh (${p2Ref.id})`);

    const p3Ref = await addDoc(collection(db, 'patients'), {
        uid: null,
        firstName: 'Mohammed',
        lastName: 'Ali',
        dob: '1965-03-30',
        gender: 'Male',
        bloodGroup: 'A-',
        phone: '+91 9345678901',
        address: '78, Park Street, Chennai',
        assignedDoctorId: doctorId,
        emergencyContact: 'Fatima Ali — +91 9345678902',
        createdAt: serverTimestamp(),
    });
    console.log(`✅ Patient record: Mohammed Ali (${p3Ref.id})`);

    // ── 3. Create medications ────────────────────────────────────────
    const meds = [
        { patientId: p1Ref.id, drugName: 'Metoprolol', dosage: '50mg', frequency: 'Once daily', duration: '3 months', prescribedBy: doctorId },
        { patientId: p1Ref.id, drugName: 'Aspirin', dosage: '75mg', frequency: 'Once daily', duration: 'Lifelong', prescribedBy: doctorId },
        { patientId: p2Ref.id, drugName: 'Amoxicillin', dosage: '500mg', frequency: 'Twice daily', duration: '7 days', prescribedBy: doctorId },
        { patientId: p2Ref.id, drugName: 'Pantoprazole', dosage: '40mg', frequency: 'Once daily (before food)', duration: '14 days', prescribedBy: doctorId },
        { patientId: p3Ref.id, drugName: 'Atorvastatin', dosage: '40mg', frequency: 'Once at night', duration: 'Lifelong', prescribedBy: doctorId },
    ];
    for (const m of meds) {
        await addDoc(collection(db, 'medications'), { ...m, createdAt: serverTimestamp() });
    }
    console.log(`✅ ${meds.length} medication records created`);

    // ── 4. Create reports ────────────────────────────────────────────
    const report1Ref = await addDoc(collection(db, 'reports'), {
        patientId: p1Ref.id,
        doctorId,
        status: 'approved',
        admissionDate: '2026-01-10',
        dischargeDate: '2026-01-17',
        isAiGenerated: true,
        generatedContent: {
            summary: 'Ravi Kumar, a 45-year-old male, was admitted on 10 Jan 2026 with chest pain and shortness of breath. ECG confirmed ST-elevation myocardial infarction (STEMI). Primary PCI was performed successfully. Patient discharged in stable condition on 17 Jan 2026.',
            diagnosis: 'ST-Elevation Myocardial Infarction (STEMI) — Anterior Wall',
            treatment: 'Emergency primary PCI with drug-eluting stent placement in LAD. IV Heparin, Aspirin, Clopidogrel loading doses administered.',
            medications: ['Aspirin 75mg OD', 'Clopidogrel 75mg OD × 12 months', 'Metoprolol 50mg OD', 'Atorvastatin 40mg ON', 'Ramipril 2.5mg OD'],
            advice: 'Strict low-sodium, low-fat diet. No strenuous physical activity for 4 weeks. Avoid smoking. Monitor BP and HR daily.',
            followUp: 'Cardiology OPD in 2 weeks. Repeat ECG and Echo at 4 weeks.',
            labHighlights: 'Troponin I: 18.4 ng/mL (elevated). LDL: 152 mg/dL. HbA1c: 6.1%. CBC normal.',
            isAiGenerated: true,
        },
        finalContent: `DISCHARGE SUMMARY\n\nPATIENT: Ravi Kumar | DOB: 14-May-1980 | MRN: P-${p1Ref.id.slice(0, 6).toUpperCase()}\nADMISSION: 10-Jan-2026  DISCHARGE: 17-Jan-2026\n\nDIAGNOSIS\nST-Elevation Myocardial Infarction (STEMI) — Anterior Wall\n\nTREATMENT\nEmergency primary PCI with drug-eluting stent placement in LAD.\n\nMEDICATIONS\n1. Aspirin 75mg OD\n2. Clopidogrel 75mg OD × 12 months\n3. Metoprolol 50mg OD\n4. Atorvastatin 40mg ON\n5. Ramipril 2.5mg OD\n\nADVICE\nStrict low-sodium, low-fat diet. No strenuous activity for 4 weeks.\n\nFOLLOW-UP\nCardiology OPD in 2 weeks. Repeat ECG and Echo at 4 weeks.`,
        versionHistory: [{ content: 'Initial draft', savedAt: new Date().toISOString(), savedBy: doctorId }],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    console.log(`✅ Report 1 (approved): STEMI — Ravi Kumar`);

    const report2Ref = await addDoc(collection(db, 'reports'), {
        patientId: p2Ref.id,
        doctorId,
        status: 'pending_approval',
        admissionDate: '2026-02-05',
        dischargeDate: '2026-02-09',
        isAiGenerated: true,
        generatedContent: {
            summary: 'Ananya Singh, a 30-year-old female, admitted with acute appendicitis. Emergency laparoscopic appendectomy performed. Post-operative recovery uneventful.',
            diagnosis: 'Acute Appendicitis',
            treatment: 'Laparoscopic appendectomy under general anaesthesia. IV antibiotics (Ceftriaxone + Metronidazole) for 3 days post-op.',
            medications: ['Amoxicillin 500mg BD × 7 days', 'Pantoprazole 40mg OD × 14 days', 'Paracetamol 500mg TDS for pain PRN'],
            advice: 'Wound care daily. Avoid heavy lifting for 2 weeks. Light diet for first 3 days.',
            followUp: 'Surgery OPD in 1 week for wound inspection and stitch removal.',
            labHighlights: 'TLC: 14,200 (elevated). CRP: 42 mg/L. USG abdomen confirmed appendicitis.',
            isAiGenerated: true,
        },
        finalContent: 'Pending review — see generated content.',
        versionHistory: [{ content: 'AI generated', savedAt: new Date().toISOString(), savedBy: doctorId }],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    console.log(`✅ Report 2 (pending_approval): Appendicitis — Ananya Singh`);

    const report3Ref = await addDoc(collection(db, 'reports'), {
        patientId: p3Ref.id,
        doctorId,
        status: 'draft',
        admissionDate: '2026-02-18',
        dischargeDate: '2026-02-21',
        isAiGenerated: false,
        generatedContent: {
            summary: 'Mohammed Ali, a 60-year-old male, admitted with uncontrolled hypertension and dyslipidaemia. Medication adjustments made. Discharged with updated prescription.',
            diagnosis: 'Hypertensive Crisis with Dyslipidaemia',
            treatment: 'IV Labetalol for BP control. Medication titration.',
            medications: ['Amlodipine 10mg OD', 'Telmisartan 80mg OD', 'Atorvastatin 40mg ON', 'Aspirin 75mg OD'],
            advice: 'Daily BP monitoring. Low salt diet. Regular aerobic exercise.',
            followUp: 'Medicine OPD in 2 weeks. Repeat lipid profile in 6 weeks.',
            labHighlights: 'BP: 178/110 on admission. LDL: 180 mg/dL. Creatinine: 1.1 mg/dL.',
            isAiGenerated: false,
        },
        finalContent: 'Draft — under review.',
        versionHistory: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    console.log(`✅ Report 3 (draft): Hypertension — Mohammed Ali`);

    // ── 5. Audit logs ────────────────────────────────────────────────
    const logs = [
        { action: 'CREATE_USER', details: 'Created doctor account: doctor@hospital.com', userId: adminId },
        { action: 'CREATE_USER', details: 'Created nurse account: nurse@hospital.com', userId: adminId },
        { action: 'GENERATE_REPORT', details: `AI Report generated for patient ${p1Ref.id}`, userId: doctorId },
        { action: 'GENERATE_REPORT', details: `AI Report generated for patient ${p2Ref.id}`, userId: doctorId },
        { action: 'CHANGE_ROLE', details: 'Role changed to nurse', userId: adminId },
    ];
    for (const log of logs) {
        await addDoc(collection(db, 'auditLogs'), { ...log, timestamp: serverTimestamp() });
    }
    console.log(`✅ ${logs.length} audit logs created`);

    console.log('\n🎉 Seed complete! Demo credentials:\n');
    console.log('  Admin:   admin@hospital.com  / admin123');
    console.log('  Doctor:  doctor@hospital.com / doctor123');
    console.log('  Nurse:   nurse@hospital.com  / nurse123');
    console.log('  Patient: patient@hospital.com / patient123\n');
}

seed().catch(console.error);
