import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  description: string;
  createdAt: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'app-farmacia',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './farmacia.component.html',
  styleUrls: ['./farmacia.component.scss']
})
export class FarmaciaComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  searchTerm: string = '';
  cart: CartItem[] = [];
  showCart: boolean = false;
  showCheckoutModal: boolean = false;
  showPaymentModal: boolean = false;
  currentOrder: any = null;

  checkoutForm = {
    name: '',
    email: '',
    phone: '',
    address: ''
  };

  paymentForm = {
    method: 'CASH' as 'CASH' | 'CARD' | 'YAPE' | 'PLIN' | 'TRANSFER',
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  };

  paymentMethods = [
    { value: 'CASH', label: '💰 Efectivo (Pago contra entrega)' },
    { value: 'CARD', label: '💳 Tarjeta de Crédito/Débito' },
    { value: 'YAPE', label: '📱 Yape' },
    { value: 'PLIN', label: '📱 Plin' },
    { value: 'TRANSFER', label: '🏦 Transferencia Bancaria' }
  ];

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loadProducts();
    this.loadCart();
    this.loadUserData();
  }

  loadProducts(): void {
    this.http.get<any[]>('http://localhost:3000/api/products').subscribe({
      next: (products) => {
        this.products = products;
        this.filterProducts();
      },
      error: (error) => {
        console.error('Error cargando productos:', error);
        // Datos de ejemplo si falla la API
        this.products = [
          { id: 1, name: 'Paracetamol 500mg', price: 15.00, stock: 100, description: 'Analgésico y antipirético', createdAt: new Date().toISOString() },
          { id: 2, name: 'Ibuprofeno 400mg', price: 25.00, stock: 80, description: 'Antiinflamatorio', createdAt: new Date().toISOString() },
          { id: 3, name: 'Amoxicilina 500mg', price: 35.00, stock: 50, description: 'Antibiótico', createdAt: new Date().toISOString() }
        ];
        this.filterProducts();
      }
    });
  }

  loadUserData(): void {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        this.checkoutForm.name = userData.name || '';
        this.checkoutForm.email = userData.email || '';
        this.checkoutForm.phone = userData.phone || '';
      } catch (e) { }
    }
  }

  loadCart(): void {
    const storedCart = localStorage.getItem('farmacia_cart');
    if (storedCart) {
      this.cart = JSON.parse(storedCart);
    }
  }

  saveCart(): void {
    localStorage.setItem('farmacia_cart', JSON.stringify(this.cart));
  }

  filterProducts(): void {
    this.filteredProducts = this.products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchesSearch;
    });
  }

  addToCart(product: Product): void {
    const existingItem = this.cart.find(item => item.product.id === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        existingItem.quantity++;
      } else {
        alert('No hay suficiente stock disponible');
        return;
      }
    } else {
      this.cart.push({ product, quantity: 1 });
    }
    this.saveCart();
    alert(`✅ ${product.name} agregado al carrito`);
  }

  removeFromCart(index: number): void {
    this.cart.splice(index, 1);
    this.saveCart();
  }

  updateQuantity(index: number, quantity: number): void {
    const item = this.cart[index];
    if (quantity > 0 && quantity <= item.product.stock) {
      item.quantity = quantity;
      this.saveCart();
    } else if (quantity > item.product.stock) {
      alert('No hay suficiente stock');
    }
  }

  getCartTotal(): number {
    return this.cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  }

  getCartItemCount(): number {
    return this.cart.reduce((count, item) => count + item.quantity, 0);
  }

  openCheckout(): void {
    if (this.cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }
    this.loadUserData();
    this.showCheckoutModal = true;
  }

  processCheckout(): void {
    if (!this.checkoutForm.name || !this.checkoutForm.email || !this.checkoutForm.address) {
      alert('Por favor complete todos los campos');
      return;
    }

    const orderData = {
      items: this.cart.map(item => ({
        productId: Number(item.product.id),     
        quantity: Number(item.quantity),        
        price: Number(item.product.price)       
      })),
      customerInfo: {
        name: this.checkoutForm.name,
        email: this.checkoutForm.email,
        phone: this.checkoutForm.phone,
        address: this.checkoutForm.address,
        total: this.getCartTotal()
      },
      paymentMethod: this.paymentForm.method
    };

    this.http.post('http://localhost:3000/api/orders', orderData).subscribe({
      next: (order: any) => {
        this.currentOrder = order;
        this.closeCheckout();

        if (this.paymentForm.method === 'CASH') {
          // Pago contra entrega, confirmar directamente
          this.http.post(`http://localhost:3000/api/orders/${order.id}/pay`, {}).subscribe({
            next: (result: any) => {
              alert('✅ ¡Pedido realizado con éxito!\nSe ha enviado el comprobante a tu correo.');
              this.clearCart();
              this.loadProducts();
            },
            error: (error) => {
              console.error('Error al procesar pago:', error);
              alert('Error al procesar el pedido');
            }
          });
        } else {
          // Mostrar modal de pago para otros métodos
          this.showPaymentModal = true;
        }
      },
      error: (error) => {
        console.error('Error al crear orden:', error);
        alert('Error al crear el pedido. Verifica el stock disponible.');
      }
    });
  }

  processPayment(): void {
    if (!this.currentOrder) return;

    // Validar datos de tarjeta si es necesario
    if (this.paymentForm.method === 'CARD') {
      if (!this.paymentForm.cardNumber || !this.paymentForm.cardName ||
        !this.paymentForm.expiryDate || !this.paymentForm.cvv) {
        alert('Por favor complete todos los datos de la tarjeta');
        return;
      }
    }

    const paymentData = {
      method: this.paymentForm.method,
      ...(this.paymentForm.method === 'CARD' && {
        cardNumber: this.paymentForm.cardNumber,
        cardName: this.paymentForm.cardName,
        expiryDate: this.paymentForm.expiryDate,
        cvv: this.paymentForm.cvv
      })
    };

    this.http.post(`http://localhost:3000/api/orders/${this.currentOrder.id}/pay`, paymentData).subscribe({
      next: (result: any) => {
        this.showPaymentModal = false;
        alert('✅ ¡Pago procesado con éxito!\nSe ha enviado el comprobante a tu correo.');
        this.clearCart();
        this.loadProducts();
        this.currentOrder = null;
        this.resetPaymentForm();
      },
      error: (error) => {
        console.error('Error en pago:', error);
        alert('❌ Error al procesar el pago. Intente nuevamente.');
      }
    });
  }

  resetPaymentForm(): void {
    this.paymentForm = {
      method: 'CASH',
      cardNumber: '',
      cardName: '',
      expiryDate: '',
      cvv: ''
    };
  }

  clearCart(): void {
    this.cart = [];
    this.saveCart();
  }

  closeCheckout(): void {
    this.showCheckoutModal = false;
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.currentOrder = null;
    this.resetPaymentForm();
  }

  toggleCart(): void {
    this.showCart = !this.showCart;
  }

  formatPrice(price: number): string {
    return `S/ ${price.toFixed(2)}`;
  }

  closeModalOnBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.closeCheckout();
      this.closePaymentModal();
    }
  }
}