import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface MedicalHistory {
  id: number;
  patientId: number;
  chronicDiseases: string[];
  surgeries: string[];
  familyHistory: string;
  medications: string[];
  createdAt: string;
  updatedAt: string;
  images?: MedicalImage[];
}

interface MedicalImage {
  id: number;
  filename: string;
  originalName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

interface Doctor {
  id: number;
  name: string;
  email: string;
  phone: string;
  specialtyId: number;
  specialtyName: string;
}

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

interface Treatment {
  id: number;
  patientId: number;
  description: string;
  duration: number;
  durationUnit: string;
  medications: Medication[];
  startDate: string;
  endDate: string;
  status: string;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: number;
}

interface DailyMedication {
  medicationName: string;
  dosage: string;
  schedule: string;
  time: string;
}

@Component({
  selector: 'app-dashboard-paciente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard-paciente.component.html',
  styleUrls: ['./dashboard-paciente.component.scss']
})
export class DashboardPacienteComponent implements OnInit {
  activeTab: string = 'appointments';
  patientName: string = '';
  patientId: number = 0;
  private apiUrl = 'https://meditek-backend.onrender.com';
  //Historial medico
  showMedicalHistoryModal: boolean = false;
  medicalHistory: MedicalHistory | null = null;
  isEditingMedicalHistory: boolean = false;
  editMedicalHistoryForm = {
    chronicDiseasesText: '',
    surgeriesText: '',
    familyHistory: '',
    medicationsText: ''
  };
  pendingImages: File[] = [];
  uploadingImages: boolean = false;
  // Doctores
  doctors: Doctor[] = [];
  availableDoctors: Doctor[] = [];

  // Citas
  appointments: Appointment[] = [];
  showAppointmentModal: boolean = false;
  appointmentForm = {
    doctorId: null as number | null,
    date: '',
    time: '',
    reason: ''
  };

  selectedAppointment: Appointment | null = null;
  showRescheduleModal: boolean = false;
  rescheduleDate: string = '';
  rescheduleTime: string = '';

  // Tratamientos
  treatments: Treatment[] = [];
  dailyMedications: DailyMedication[] = [];
  upcomingAppointments: Appointment[] = [];
  medicalReminders: string[] = [];

  userId: number = 0;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loadUserData();
  }

  openGLPI(): void {
    window.open('https://utp.us2.glpi-network.cloud/', '_blank');
  }

  loadUserData(): void {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        this.patientName = userData.name || 'Paciente';
        this.userId = userData.id || 0;  // ← Guardar el userId
        console.log('UserId obtenido:', this.userId);

        this.loadData();
      } catch (e) {
        this.patientName = 'Paciente';
        this.userId = 0;
      }
    }
  }

  loadData(): void {
    this.loadDoctors();
    this.loadAppointments();  // ← Este método usará this.userId
    this.loadTreatments();
  }


  loadDoctors(): void {
    this.http.get<any[]>(`${this.apiUrl}/api/doctors`).subscribe({
      next: (data) => {
        this.doctors = data.map(doctor => ({
          id: doctor.id,
          name: doctor.user?.name || doctor.name,
          email: doctor.user?.email || '',
          phone: doctor.user?.phone || '',
          specialtyId: doctor.specialtyId,
          specialtyName: doctor.specialty?.name || doctor.specialtyName
        }));
        this.availableDoctors = [...this.doctors];
      },
      error: (error) => console.error('Error loading doctors:', error)
    });
  }

  loadAppointments(): void {
    // Usar userId en lugar de patientId
    this.http.get<Appointment[]>(`${this.apiUrl}/api/appointments/patient/${this.userId}`).subscribe({
      next: (data) => {
        this.appointments = data;
        this.updateCalendar();
      },
      error: (error) => console.error('Error loading appointments:', error)
    });
  }

  loadTreatments(): void {
    this.http.get<any>(`${this.apiUrl}/api/patients/by-user/${this.userId}`).subscribe({
      next: (data) => {
        this.treatments = data.treatments || [];
        this.updateCalendar();
      },
      error: (error) => console.error('Error loading treatments:', error)
    });
  }

  updateCalendar(): void {
    // Actualizar medicamentos diarios
    this.dailyMedications = [];
    const today = new Date().toISOString().split('T')[0];

    this.treatments.forEach(treatment => {
      if (treatment.startDate <= today && treatment.endDate >= today) {
        treatment.medications.forEach(med => {
          this.dailyMedications.push({
            medicationName: med.name,
            dosage: med.dosage,
            schedule: med.frequency,
            time: this.getScheduleTime(med.frequency)
          });
        });
      }
    });

    // Próximas citas (próximos 7 días)
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);

    this.upcomingAppointments = this.appointments.filter(a => {
      const appointmentDate = new Date(a.date);
      return a.status !== 'cancelled' && a.status !== 'completed' && appointmentDate >= now && appointmentDate <= nextWeek;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Recordatorios médicos
    this.medicalReminders = [];

    // Recordatorio de medicamentos
    if (this.dailyMedications.length > 0) {
      this.medicalReminders.push(`💊 Tienes ${this.dailyMedications.length} medicamento(s) para tomar hoy`);
    }

    // Recordatorio de citas próximas
    if (this.upcomingAppointments.length > 0) {
      this.medicalReminders.push(`📅 Tienes ${this.upcomingAppointments.length} cita(s) programada(s) para esta semana`);
    }

    // Recordatorio de tratamientos activos
    if (this.treatments.length > 0) {
      this.medicalReminders.push(`📋 Tienes ${this.treatments.length} tratamiento(s) activo(s)`);
    }
  }

  getScheduleTime(frequency: string): string {
    if (frequency.includes('8')) return '08:00';
    if (frequency.includes('12')) return '12:00';
    if (frequency.includes('20')) return '20:00';
    return 'Según indicación';
  }

  // ==================== CITAS MÉDICAS ====================
  openAppointmentModal(): void {
    this.appointmentForm = {
      doctorId: null,
      date: '',
      time: '',
      reason: ''
    };
    this.showAppointmentModal = true;
  }

  saveAppointment(): void {
    if (!this.appointmentForm.doctorId || !this.appointmentForm.date || !this.appointmentForm.time) {
      alert('Por favor complete todos los campos');
      return;
    }

    const dateTime = new Date(`${this.appointmentForm.date}T${this.appointmentForm.time}`);

    const appointmentData = {
      userId: this.userId,  // ← Ahora this.userId SÍ existe
      doctorId: this.appointmentForm.doctorId,
      date: dateTime.toISOString(),
      reason: this.appointmentForm.reason,
      status: 'pending'
    };

    console.log('Enviando cita:', appointmentData);

    this.http.post<Appointment>(`${this.apiUrl}/api/appointments`, appointmentData).subscribe({
      next: (newAppointment) => {
        this.appointments.push(newAppointment);
        this.updateCalendar();
        this.closeAppointmentModal();
        alert('✅ Cita reservada exitosamente. Esperando confirmación del médico.');
      },
      error: (error) => {
        console.error('Error creating appointment:', error);
        alert('Error al reservar la cita: ' + (error.error?.message || 'Intente nuevamente'));
      }
    });
  }

  cancelAppointment(appointment: Appointment): void {
    if (confirm('¿Estás seguro de cancelar esta cita?')) {
      this.http.put(`${this.apiUrl}/api/appointments/${appointment.id}/status`, { status: 'cancelled' }).subscribe({
        next: () => {
          appointment.status = 'cancelled';
          this.updateCalendar();
          alert('❌ Cita cancelada');
        },
        error: (error) => {
          console.error('Error cancelling appointment:', error);
          alert('Error al cancelar la cita');
        }
      });
    }
  }

  openRescheduleModal(appointment: Appointment): void {
    this.selectedAppointment = appointment;
    this.rescheduleDate = appointment.date;
    this.rescheduleTime = appointment.time;
    this.showRescheduleModal = true;
  }

  confirmReschedule(): void {
    if (this.selectedAppointment && this.rescheduleDate && this.rescheduleTime) {
      const dateTime = new Date(`${this.rescheduleDate}T${this.rescheduleTime}`);

      this.http.put(`${this.apiUrl}/api/appointments/${this.selectedAppointment.id}`, {
        date: dateTime.toISOString(),
        status: 'pending'
      }).subscribe({
        next: (updated: any) => {
          this.selectedAppointment!.date = updated.date;
          this.selectedAppointment!.time = updated.time;
          this.selectedAppointment!.status = updated.status;
          this.updateCalendar();
          this.closeRescheduleModal();
          alert('📅 Cita reprogramada exitosamente');
        },
        error: (error) => {
          console.error('Error rescheduling appointment:', error);
          alert('Error al reprogramar la cita');
        }
      });
    }
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pendiente',
      'confirmed': 'Confirmada',
      'in-progress': 'En atención',
      'completed': 'Finalizada',
      'cancelled': 'Cancelada'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'pending': 'pending',
      'confirmed': 'confirmed',
      'in-progress': 'in-progress',
      'completed': 'completed',
      'cancelled': 'cancelled'
    };
    return classMap[status] || 'pending';
  }

  closeAppointmentModal(): void {
    this.showAppointmentModal = false;
  }

  closeRescheduleModal(): void {
    this.showRescheduleModal = false;
    this.selectedAppointment = null;
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
      if (modalType === 'appointment') {
        this.closeAppointmentModal();
      } else if (modalType === 'reschedule') {
        this.closeRescheduleModal();
      } else if (modalType === 'medicalHistory') {
        this.closeMedicalHistoryModal();
      }
    }
  }

  todayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  getTreatmentProgress(treatment: Treatment): number {
    const start = new Date(treatment.startDate).getTime();
    const end = new Date(treatment.endDate).getTime();
    const now = new Date().getTime();

    if (now <= start) return 0;
    if (now >= end) return 100;

    const total = end - start;
    const elapsed = now - start;
    return (elapsed / total) * 100;
  }

  openMedicalHistory(): void {
    this.loadMedicalHistory();
  }

  loadMedicalHistory(): void {
    // Primero obtener el patientId desde el userId
    this.http.get<any>(`${this.apiUrl}/api/patients/by-user/${this.userId}`).subscribe({
      next: (patientData) => {
        const patientId = patientData.id;
        this.http.get<MedicalHistory>(`${this.apiUrl}/api/medical-history/patient/${patientId}`).subscribe({
          next: (data) => {
            this.medicalHistory = data;
            this.showMedicalHistoryModal = true;
            this.isEditingMedicalHistory = false;
          },
          error: (error) => {
            console.error('Error loading medical history:', error);
            alert('Error al cargar el historial médico');
          }
        });
      },
      error: (error) => {
        console.error('Error loading patient data:', error);
        alert('Error al cargar datos del paciente');
      }
    });
  }

  editMedicalHistory(): void {
    if (this.medicalHistory) {
      this.editMedicalHistoryForm = {
        chronicDiseasesText: this.medicalHistory.chronicDiseases?.join(', ') || '',
        surgeriesText: this.medicalHistory.surgeries?.join(', ') || '',
        familyHistory: this.medicalHistory.familyHistory || '',
        medicationsText: this.medicalHistory.medications?.join(', ') || ''
      };
      this.pendingImages = [];
      this.isEditingMedicalHistory = true;
    }
  }

  cancelEditMedicalHistory(): void {
    this.isEditingMedicalHistory = false;
    this.pendingImages = [];
  }

  saveMedicalHistory(): void {
    if (!this.medicalHistory) return;

    // Primero obtener patientId
    this.http.get<any>(`${this.apiUrl}/api/patients/by-user/${this.userId}`).subscribe({
      next: (patientData) => {
        const patientId = patientData.id;

        const updateData = {
          chronicDiseases: this.editMedicalHistoryForm.chronicDiseasesText.split(',').map(s => s.trim()).filter(s => s),
          surgeries: this.editMedicalHistoryForm.surgeriesText.split(',').map(s => s.trim()).filter(s => s),
          familyHistory: this.editMedicalHistoryForm.familyHistory,
          medications: this.editMedicalHistoryForm.medicationsText.split(',').map(s => s.trim()).filter(s => s)
        };

        this.http.put(`${this.apiUrl}/api/medical-history/patient/${patientId}`, updateData)
          .subscribe({
            next: async () => {
              if (this.pendingImages.length > 0) {
                await this.uploadMedicalImages(patientId);
              }
              this.loadMedicalHistory();
              this.isEditingMedicalHistory = false;
              alert('✅ Historial médico actualizado');
            },
            error: (error) => {
              console.error('Error updating medical history:', error);
              alert('Error al guardar el historial médico');
            }
          });
      }
    });
  }

  onImagesSelected(event: any): void {
    const files = Array.from(event.target.files);
    this.pendingImages.push(...files as File[]);
  }

  async uploadMedicalImages(patientId: number): Promise<void> {
    if (!this.pendingImages.length) return;

    this.uploadingImages = true;
    const formData = new FormData();

    this.pendingImages.forEach(file => {
      formData.append('images', file);
    });

    try {
      await this.http.post(`${this.apiUrl}/api/medical-history/upload-images/${patientId}`, formData).toPromise();
      this.pendingImages = [];
      alert('📸 Imágenes subidas correctamente');
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Error al subir imágenes');
    } finally {
      this.uploadingImages = false;
    }
  }

  deleteMedicalImage(imageId: number): void {
    if (confirm('¿Eliminar esta imagen?')) {
      this.http.delete(`${this.apiUrl}/api/medical-history/image/${imageId}`).subscribe({
        next: () => {
          this.loadMedicalHistory();
          alert('🗑️ Imagen eliminada');
        },
        error: (error) => {
          console.error('Error deleting image:', error);
          alert('Error al eliminar la imagen');
        }
      });
    }
  }

  closeMedicalHistoryModal(): void {
    this.showMedicalHistoryModal = false;
    this.medicalHistory = null;
    this.isEditingMedicalHistory = false;
    this.pendingImages = [];
  }

  getImageUrl(filename: string): string {
    return `${this.apiUrl}/uploads/medical-images/${filename}`;
  }
}