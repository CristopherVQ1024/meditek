import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';


// Agregar en el componente
interface MedicalImage {
  id: number;
  filename: string;
  originalName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

interface MedicalHistoryExtended extends MedicalHistory {
  images?: MedicalImage[];
}

// Agrega esta interfaz junto a las otras
interface Appointment {
  id: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  specialtyName: string;
  date: string;
  time: string;
  reason: string;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: string;
}

// Interfaces actualizadas para el backend
interface Patient {
  id: number;
  userId: number;
  user: {
    id: number;
    name: string;
    email: string;
    phone: string;
    dni: string;
    age: number;
  };
  address: string;
  bloodType: string;
  allergies: string[];
  createdAt: string;
  updatedAt: string;
  medicalHistory?: MedicalHistory;
}

interface MedicalHistory {
  id: number;
  patientId: number;
  chronicDiseases: string[];
  surgeries: string[];
  familyHistory: string;
  medications: string[];
  createdAt: string;
  updatedAt: string;
}

interface Consultation {
  id: number;
  patientId: number;
  doctorId: number;
  date: string;
  symptoms: string;
  diagnosis: string;
  observations: string;
  status: string;
  patient?: {
    id: number;
    user: {
      name: string;
    };
  };
  doctor?: {
    id: number;
    user: {
      name: string;
    };
  };
  treatment?: Treatment;
  prescription?: Prescription;
}

interface Treatment {
  id: number;
  consultationId: number;
  patientId: number;
  doctorId: number;
  description: string;
  duration: number;
  durationUnit: string;
  medications: Medication[];
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  patient?: {
    id: number;
    userId: number;
    user?: {
      id: number;
      name?: string;
      email: string;
      phone?: string;
    };
  };
  doctor?: {
    id: number;
    user: {
      name: string;
    };
  };
}
interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: number;
}

interface Prescription {
  id: number;
  consultationId: number;
  patientId: number;
  medications: string;
  instructions: string;
  createdAt: string;
  hospitalSeal: string;
}

interface Referral {
  id: number;
  patientId: number;
  patient?: {
    id: number;
    user: {
      name: string;
    };
  };
  fromSpecialty: string;
  toSpecialtyId: number;
  toSpecialty?: {
    id: number;
    name: string;
  };
  reason: string;
  status: string;
  createdAt: string;
  doctorId: number;
}
@Component({
  selector: 'app-dashboard-medico',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-medico.component.html',
  styleUrls: ['./dashboard-medico.component.scss']
})
export class DashboardMedicoComponent implements OnInit {
  activeTab: string = 'patients';
  doctorName: string = 'Dr. Médico';
  doctorId: number = 0;
  referrals: Referral[] = [];
  errorMessage: string = '';
  //Imagenes
  selectedPatientForHistory: Patient | null = null;
  medicalHistoryData: MedicalHistoryExtended = {
    id: 0,
    patientId: 0,
    chronicDiseases: [],
    surgeries: [],
    familyHistory: '',
    medications: [],
    createdAt: '',
    updatedAt: '',
    images: []
  };
  isEditingMedicalHistory: boolean = false;
  editMedicalHistoryForm = {
    chronicDiseasesText: '',
    surgeriesText: '',
    familyHistory: '',
    medicationsText: ''
  };
  pendingImages: File[] = [];
  uploadingImages: boolean = false;
  // Pacientes
  patients: Patient[] = [];
  selectedPatient: Patient | null = null;
  showPatientModal: boolean = false;
  editingPatient: Patient | null = null;
  patientForm = {
    name: '',
    email: '',
    phone: '',
    dni: '',
    age: null as number | null,
    address: '',
    bloodType: '',
    allergies: ''
  };

  // Consultas
  consultations: Consultation[] = [];
  showConsultationModal: boolean = false;
  selectedConsultation: Consultation | null = null;
  consultationForm = {
    patientId: null as number | null,
    symptoms: '',
    diagnosis: '',
    observations: '',
    images: [] as string[]
  };

  // Tratamientos
  treatments: Treatment[] = [];
  showTreatmentModal: boolean = false;
  selectedTreatment: Treatment | null = null;
  treatmentForm = {
    consultationId: null as number | null,
    patientId: null as number | null,
    description: '',
    duration: null as number | null,
    durationUnit: 'days' as 'days' | 'weeks' | 'months',
    medications: [] as Medication[],
    startDate: '',
    endDate: ''
  };

  //Citas
  appointments: Appointment[] = [];

  newMedication: Medication = { name: '', dosage: '', frequency: '', duration: 0 };

  // Recetas
  showPrescriptionModal: boolean = false;
  prescriptionForm = {
    consultationId: null as number | null,
    patientId: null as number | null,
    medications: '',
    instructions: ''
  };

  // Transferencias
  showReferralModal: boolean = false;
  referralForm = {
    patientId: null as number | null,
    toSpecialty: '',
    reason: ''
  };

  specialties: string[] = ['Medicina General', 'Cardiología', 'Pediatría', 'Neurología', 'Odontología', 'Oftalmología', 'Dermatología', 'Ginecología'];

  // Historial Clínico
  showMedicalHistoryModal: boolean = false;
  selectedMedicalHistory: MedicalHistory | null = null;

  // Próxima cita
  showAppointmentModal: boolean = false;
  appointmentDate: string = '';

  private apiUrl = 'https://meditek-backend.onrender.com/api';

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.getDoctorName();
    this.loadAllData();
  }

  openGLPI(): void {
    window.open('https://utp.us2.glpi-network.cloud/', '_blank');
  }
  
  // dashboard-medico.component.ts
  getDoctorName(): void {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      console.log('Usuario logueado:', userData);  // ← Mira qué id tiene
      this.doctorName = userData.name || 'Dr. Médico';
      this.loadDoctorId(userData.id);
    }
  }

  loadDoctorId(userId: number): void {
    this.http.get<any>(`${this.apiUrl}/doctors/by-user/${userId}`).subscribe({
      next: (doctor) => {
        this.doctorId = doctor.id;
        this.loadConsultations();
        this.loadTreatments();
        this.loadReferrals();
        this.loadAppointments();
      },
      error: (error) => console.error('Error loading doctor:', error)
    });
  }

  loadAllData(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.http.get<Patient[]>(`${this.apiUrl}/patients`).subscribe({
      next: (data) => {
        this.patients = data;
      },
      error: (error) => console.error('Error loading patients:', error)
    });
  }

  loadConsultations(): void {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    const user = JSON.parse(userStr);

    this.http.get<Consultation[]>(`${this.apiUrl}/consultations/doctor/${user.id}`).subscribe({
      next: (data) => {
        console.log('Consultas cargadas:', data);
        this.consultations = data;
      },
      error: (error) => console.error('Error loading consultations:', error)
    });
  }

  loadTreatments(): void {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    const user = JSON.parse(userStr);
    this.http.get<Treatment[]>(`${this.apiUrl}/treatments/doctor/${user.doctorId}`).subscribe({
      next: (data) => {
        this.treatments = data;
      },
      error: (error) => console.error('Error loading treatments:', error)
    });
  }

  loadReferrals(): void {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    const user = JSON.parse(userStr);
    this.http.get<Referral[]>(`${this.apiUrl}/referrals/doctor/${user.id}`).subscribe({
      next: (data) => {
        this.referrals = data;
      },
      error: (error) => console.error('Error loading referrals:', error)
    });
  }

  // ==================== GESTIÓN DE PACIENTES ====================
  openPatientModal(patient?: Patient): void {
    if (patient) {
      this.editingPatient = patient;
      this.patientForm = {
        name: patient.user.name,
        email: patient.user.email,
        phone: patient.user.phone,
        dni: patient.user.dni,
        age: patient.user.age,
        address: patient.address,
        bloodType: patient.bloodType,
        allergies: patient.allergies.join(', ')
      };
    } else {
      this.editingPatient = null;
      this.patientForm = {
        name: '',
        email: '',
        phone: '',
        dni: '',
        age: null,
        address: '',
        bloodType: '',
        allergies: ''
      };
    }
    this.showPatientModal = true;
  }

  savePatient(): void {
    if (!this.patientForm.name || !this.patientForm.dni) return;

    const patientData = {
      name: this.patientForm.name,
      email: this.patientForm.email,
      phone: this.patientForm.phone,
      dni: this.patientForm.dni,
      age: this.patientForm.age,
      address: this.patientForm.address,
      bloodType: this.patientForm.bloodType,
      allergies: this.patientForm.allergies.split(',').map(a => a.trim())
    };

    if (this.editingPatient) {
      this.http.put(`${this.apiUrl}/patients/${this.editingPatient.id}`, patientData).subscribe({
        next: () => {
          this.loadPatients();
          this.closePatientModal();
        },
        error: (error) => console.error('Error updating patient:', error)
      });
    } else {
      this.http.post(`${this.apiUrl}/patients`, patientData).subscribe({
        next: () => {
          this.loadPatients();
          this.closePatientModal();
        },
        error: (error) => console.error('Error creating patient:', error)
      });
    }
  }

  deletePatient(id: number): void {
    if (confirm('¿Eliminar este paciente? Se eliminarán todas sus consultas y tratamientos.')) {
      this.http.delete(`${this.apiUrl}/patients/${id}`).subscribe({
        next: () => {
          this.loadPatients();
        },
        error: (error) => console.error('Error deleting patient:', error)
      });
    }
  }

  closePatientModal(): void {
    this.showPatientModal = false;
    this.editingPatient = null;
  }

  // ==================== CONSULTA MÉDICA ====================
  openConsultationModal(patient?: Patient): void {
    console.log('openConsultationModal llamado');
    console.log('consultationForm.patientId:', this.consultationForm.patientId);
    console.log('patient recibido:', patient);

    // Si no hay paciente seleccionado y no se pasó un paciente, mostrar error
    if (!this.consultationForm.patientId && !patient) {
      this.errorMessage = 'Por favor seleccione un paciente primero';
      console.log('Error: No hay paciente seleccionado');
      return;
    }

    let patientId = this.consultationForm.patientId;
    console.log("PACIENTE ID antes: ", patientId);

    if (patient) {
      patientId = patient.id;
      console.log("PACIENTE ID desde parámetro: ", patientId);
    }

    this.consultationForm = {
      patientId: patientId,
      symptoms: '',
      diagnosis: '',
      observations: '',
      images: []
    };

    console.log("showConsultationModal antes:", this.showConsultationModal);
    this.showConsultationModal = true;
    console.log("showConsultationModal después:", this.showConsultationModal);

    this.errorMessage = '';
  }

  saveConsultation(): void {
    // Validaciones
    if (!this.consultationForm.patientId) {
      this.errorMessage = 'Por favor seleccione un paciente';
      return;
    }

    if (!this.consultationForm.diagnosis) {
      this.errorMessage = 'Por favor ingrese un diagnóstico';
      return;
    }

    const userStr = localStorage.getItem('user');
    if (!userStr) {
      this.errorMessage = 'Usuario no encontrado';
      return;
    }

    const user = JSON.parse(userStr);

    const consultationData = {
      patientId: this.consultationForm.patientId,
      doctorUserId: user.id,
      symptoms: this.consultationForm.symptoms,
      diagnosis: this.consultationForm.diagnosis,
      observations: this.consultationForm.observations
    };

    console.log('Enviando consulta:', consultationData);

    this.http.post(`${this.apiUrl}/consultations`, consultationData).subscribe({
      next: (response: any) => {
        console.log('Consulta creada:', response);
        this.loadConsultations();
        this.closeConsultationModal();

        if (confirm('¿Desea agregar un tratamiento para este paciente?')) {
          this.openTreatmentModal(response);
        }

        if (confirm('¿Desea generar una receta médica?')) {
          this.openPrescriptionModal(response);
        }
      },
      error: (error) => {
        console.error('Error creating consultation:', error);
        this.errorMessage = error.error?.message || 'Error al crear la consulta';
      }
    });
  }

  closeConsultationModal(): void {
    this.showConsultationModal = false;
    this.selectedConsultation = null;
  }

  // ==================== TRATAMIENTOS ====================
  openTreatmentModal(consultation?: any): void {
    console.log('Abriendo modal de tratamiento, consultation:', consultation);

    this.selectedTreatment = null;
    this.treatmentForm = {
      consultationId: consultation?.id || null,
      patientId: consultation?.patientId || this.consultationForm.patientId,
      description: '',
      duration: null,
      durationUnit: 'days',
      medications: [],
      startDate: new Date().toISOString().split('T')[0],
      endDate: ''
    };
    this.showTreatmentModal = true;
    console.log('showTreatmentModal:', this.showTreatmentModal);
  }

  addMedication(): void {
    if (this.newMedication.name && this.newMedication.dosage) {
      this.treatmentForm.medications.push({ ...this.newMedication });
      this.newMedication = { name: '', dosage: '', frequency: '', duration: 0 };
    }
  }

  removeMedication(index: number): void {
    this.treatmentForm.medications.splice(index, 1);
  }

  calculateEndDate(): void {
    if (this.treatmentForm.duration && this.treatmentForm.startDate) {
      const start = new Date(this.treatmentForm.startDate);
      let end = new Date(start);
      switch (this.treatmentForm.durationUnit) {
        case 'days':
          end.setDate(start.getDate() + this.treatmentForm.duration);
          break;
        case 'weeks':
          end.setDate(start.getDate() + (this.treatmentForm.duration * 7));
          break;
        case 'months':
          end.setMonth(start.getMonth() + this.treatmentForm.duration);
          break;
      }
      this.treatmentForm.endDate = end.toISOString().split('T')[0];
    }
  }

  saveTreatment(): void {
    if (!this.treatmentForm.description) return;
    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    const user = JSON.parse(userStr);
    const treatmentData = {
      consultationId: this.treatmentForm.consultationId,
      patientId: this.treatmentForm.patientId,
      doctorUserId: user.id,
      description: this.treatmentForm.description,
      duration: this.treatmentForm.duration,
      durationUnit: this.treatmentForm.durationUnit,
      medications: this.treatmentForm.medications,
      startDate: this.treatmentForm.startDate,
      endDate: this.treatmentForm.endDate
    };

    this.http.post(`${this.apiUrl}/treatments`, treatmentData).subscribe({
      next: () => {
        this.loadTreatments();
        this.closeTreatmentModal();
      },
      error: (error) => console.error('Error creating treatment:', error)
    });
  }

  completeTreatment(treatment: Treatment): void {
    this.http.put(`${this.apiUrl}/treatments/${treatment.id}/status`, { status: 'completed' }).subscribe({
      next: () => {
        this.loadTreatments();
      },
      error: (error) => console.error('Error updating treatment:', error)
    });
  }

  closeTreatmentModal(): void {
    this.showTreatmentModal = false;
  }

  // ==================== RECETAS ====================
  openPrescriptionModal(consultation: any): void {
    this.prescriptionForm = {
      consultationId: consultation.id,
      patientId: consultation.patientId,
      medications: '',
      instructions: 'Tomar según indicación médica. No exceder la dosis recomendada.'
    };
    this.showPrescriptionModal = true;
  }

  generatePrescription(): void {
    if (!this.prescriptionForm.medications) return;

    const prescriptionData = {
      consultationId: this.prescriptionForm.consultationId,
      patientId: this.prescriptionForm.patientId,
      medications: this.prescriptionForm.medications,
      instructions: this.prescriptionForm.instructions
    };

    this.http.post(`${this.apiUrl}/prescriptions`, prescriptionData).subscribe({
      next: (prescription: any) => {
        alert(`📧 Receta enviada al correo del paciente\n\n${prescription.hospitalSeal}\n\nMedicamentos:\n${prescription.medications}\n\nInstrucciones:\n${prescription.instructions}\n\nAtentamente,\n${this.doctorName}`);
        this.closePrescriptionModal();
      },
      error: (error) => console.error('Error creating prescription:', error)
    });
  }

  closePrescriptionModal(): void {
    this.showPrescriptionModal = false;
  }

  // ==================== TRANSFERENCIA ====================
  openReferralModal(patient: Patient): void {
    this.referralForm = {
      patientId: patient.id,
      toSpecialty: '',
      reason: ''
    };
    this.showReferralModal = true;
  }

  createReferral(): void {
    if (!this.referralForm.toSpecialty || !this.referralForm.reason) return;

    const referralData = {
      patientId: this.referralForm.patientId,
      doctorUserId: this.doctorId,
      toSpecialty: this.referralForm.toSpecialty,
      reason: this.referralForm.reason
    };

    this.http.post(`${this.apiUrl}/referrals`, referralData).subscribe({
      next: () => {
        this.loadReferrals();
        alert(`✅ Paciente derivado a ${this.referralForm.toSpecialty}\nMotivo: ${this.referralForm.reason}\nSe ha creado una nueva cita automáticamente.`);
        this.closeReferralModal();
      },
      error: (error) => console.error('Error creating referral:', error)
    });
  }

  closeReferralModal(): void {
    this.showReferralModal = false;
  }

  // ==================== PRÓXIMA CITA ====================
  openAppointmentModal(patient: Patient): void {
    this.selectedPatient = patient;
    this.appointmentDate = '';
    this.showAppointmentModal = true;
  }

  scheduleNextAppointment(): void {
    if (!this.appointmentDate) return;

    alert(`📅 Próxima cita agendada para ${this.selectedPatient?.user.name} el día ${this.appointmentDate}\nSe ha enviado un recordatorio al correo del paciente.`);
    this.closeAppointmentModal();
  }

  closeAppointmentModal(): void {
    this.showAppointmentModal = false;
    this.selectedPatient = null;
  }

  // ==================== UTILIDADES ====================
  changeTab(tab: string): void {
    this.activeTab = tab;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  closeModalOnBackdrop(event: MouseEvent, modalType: string): void {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      switch (modalType) {
        case 'patient':
          this.closePatientModal();
          break;
        case 'consultation':
          this.closeConsultationModal();
          break;
        case 'treatment':
          this.closeTreatmentModal();
          break;
        case 'prescription':
          this.closePrescriptionModal();
          break;
        case 'referral':
          this.closeReferralModal();
          break;
        case 'appointment':
          this.closeAppointmentModal();
          break;
        case 'medicalHistory':
          this.showMedicalHistoryModal = false;
          break;
      }
    }
  }

  getSelectedPatientName(): string {
    if (!this.consultationForm.patientId) {
      return 'No hay paciente seleccionado';
    }
    const patient = this.patients.find(p => p.id === this.consultationForm.patientId);
    return patient ? `${patient.user.name} - ${patient.user.dni}` : 'Paciente no encontrado';
  }

  getPatientName(patientId: number): string {
    const patient = this.patients.find(p => p.id === patientId);
    return patient?.user.name || 'Desconocido';
  }

  loadAppointments(): void {
    if (!this.doctorId) return;

    this.http.get<Appointment[]>(`${this.apiUrl}/appointments/doctor/${this.doctorId}`).subscribe({
      next: (data) => {
        this.appointments = data;
        console.log('Citas cargadas:', this.appointments);
      },
      error: (error) => console.error('Error loading appointments:', error)
    });
  }

  getAppointmentStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pendiente',
      'confirmed': 'Confirmada',
      'in-progress': 'En atención',
      'completed': 'Finalizada',
      'cancelled': 'Cancelada'
    };
    return statusMap[status] || status;
  }

  getAppointmentStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'pending': 'pending',
      'confirmed': 'confirmed',
      'in-progress': 'in-progress',
      'completed': 'completed',
      'cancelled': 'cancelled'
    };
    return classMap[status] || 'pending';
  }

  confirmAppointment(appointment: Appointment): void {
    this.http.put(`${this.apiUrl}/appointments/${appointment.id}/status`, { status: 'confirmed' }).subscribe({
      next: () => {
        appointment.status = 'confirmed';
        alert(`✅ Cita confirmada para ${appointment.patientName} el ${appointment.date} a las ${appointment.time}`);
      },
      error: (error) => console.error('Error confirming appointment:', error)
    });
  }

  cancelAppointmentByDoctor(appointment: Appointment): void {
    if (confirm(`¿Cancelar la cita de ${appointment.patientName}?`)) {
      this.http.put(`${this.apiUrl}/appointments/${appointment.id}/status`, { status: 'cancelled' }).subscribe({
        next: () => {
          appointment.status = 'cancelled';
          alert('❌ Cita cancelada');
          this.loadAppointments(); // Recargar la lista
        },
        error: (error) => console.error('Error cancelling appointment:', error)
      });
    }
  }

  startAppointment(appointment: Appointment): void {
    // Actualizar estado de la cita
    this.http.put(`${this.apiUrl}/appointments/${appointment.id}/status`, { status: 'in-progress' }).subscribe({
      next: () => {
        appointment.status = 'in-progress';

        // Abrir modal de consulta con el paciente seleccionado
        const patient = this.patients.find(p => p.id === appointment.patientId);
        if (patient) {
          this.consultationForm.patientId = patient.id;
          this.openConsultationModal(patient);
        }
      },
      error: (error) => console.error('Error starting appointment:', error)
    });
  }

  // dashboard-medico.component.ts

  // Método para finalizar la cita (cambiar a completed)
  completeAppointment(appointment: Appointment): void {
    if (confirm(`¿Finalizar la consulta de ${appointment.patientName}?`)) {
      this.http.put(`${this.apiUrl}/appointments/${appointment.id}/status`, { status: 'completed' }).subscribe({
        next: () => {
          appointment.status = 'completed';
          alert(`✅ Consulta finalizada para ${appointment.patientName}`);
          this.loadAppointments(); // Recargar la lista          
        },
        error: (error) => {
          console.error('Error completing appointment:', error);
          alert('Error al finalizar la consulta');
        }
      });
    }
  }

  viewMedicalHistory(patient: Patient): void {
    this.selectedPatientForHistory = patient;
    this.loadMedicalHistory(patient.id);
  }

  loadMedicalHistory(patientId: number): void {
    this.http.get<MedicalHistoryExtended>(`${this.apiUrl}/medical-history/patient/${patientId}`).subscribe({
      next: (data) => {
        this.medicalHistoryData = data;
        this.showMedicalHistoryModal = true;
        this.isEditingMedicalHistory = false;
      },
      error: (error) => {
        console.error('Error loading medical history:', error);
        this.errorMessage = 'Error al cargar el historial médico';
      }
    });
  }

  editMedicalHistory(): void {
    this.editMedicalHistoryForm = {
      chronicDiseasesText: this.medicalHistoryData.chronicDiseases?.join(', ') || '',
      surgeriesText: this.medicalHistoryData.surgeries?.join(', ') || '',
      familyHistory: this.medicalHistoryData.familyHistory || '',
      medicationsText: this.medicalHistoryData.medications?.join(', ') || ''
    };
    this.pendingImages = [];
    this.isEditingMedicalHistory = true;
  }

  cancelEditMedicalHistory(): void {
    this.isEditingMedicalHistory = false;
    this.pendingImages = [];
  }

  saveMedicalHistory(): void {
    const updateData = {
      chronicDiseases: this.editMedicalHistoryForm.chronicDiseasesText.split(',').map(s => s.trim()).filter(s => s),
      surgeries: this.editMedicalHistoryForm.surgeriesText.split(',').map(s => s.trim()).filter(s => s),
      familyHistory: this.editMedicalHistoryForm.familyHistory,
      medications: this.editMedicalHistoryForm.medicationsText.split(',').map(s => s.trim()).filter(s => s)
    };

    this.http.put(`${this.apiUrl}/medical-history/patient/${this.selectedPatientForHistory?.id}`, updateData)
      .subscribe({
        next: async () => {
          if (this.pendingImages.length > 0) {
            await this.uploadMedicalImages();
          }
          this.loadMedicalHistory(this.selectedPatientForHistory!.id);
          this.isEditingMedicalHistory = false;
          this.errorMessage = '';
        },
        error: (error) => {
          console.error('Error updating medical history:', error);
          this.errorMessage = 'Error al guardar el historial médico';
        }
      });
  }

  onImagesSelected(event: any): void {
    const files = Array.from(event.target.files);
    this.pendingImages.push(...files as File[]);
  }

  async uploadMedicalImages(): Promise<void> {
    if (!this.pendingImages.length) return;

    this.uploadingImages = true;
    const formData = new FormData();

    this.pendingImages.forEach(file => {
      formData.append('images', file);
    });

    try {
      await this.http.post(`${this.apiUrl}/medical-history/upload-images/${this.selectedPatientForHistory?.id}`, formData).toPromise();
      this.pendingImages = [];
      this.loadMedicalHistory(this.selectedPatientForHistory!.id);
    } catch (error) {
      console.error('Error uploading images:', error);
      this.errorMessage = 'Error al subir imágenes';
    } finally {
      this.uploadingImages = false;
    }
  }

  deleteMedicalImage(imageId: number): void {
    if (confirm('¿Eliminar esta imagen?')) {
      this.http.delete(`${this.apiUrl}/medical-history/image/${imageId}`).subscribe({
        next: () => {
          this.loadMedicalHistory(this.selectedPatientForHistory!.id);
        },
        error: (error) => console.error('Error deleting image:', error)
      });
    }
  }

  closeMedicalHistoryModal(): void {
    this.showMedicalHistoryModal = false;
    this.selectedPatientForHistory = null;
    this.isEditingMedicalHistory = false;
    this.pendingImages = [];
  }
}