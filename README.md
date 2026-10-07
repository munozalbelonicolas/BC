# BC Especial Import - E-Commerce Platform

Plataforma de comercio electrónico de alta fidelidad para **BC Especial Import**, especializada en tecnología, electrodomésticos, confort para el hogar y aventura al aire libre.

## 🚀 Características y Apartados

- **Barra de Anuncios y Navegación**: Beneficios destacados (envíos, productos originales, compra segura) y logotipo institucional.
- **Búsqueda en Tiempo Real**: Autocompletado dinámico con previsualización de imágenes y precios.
- **Hero Comercial**: Composición publicitaria de productos con badges interactivos y llamados a la acción.
- **Catálogo de Categorías**: Acceso visual a Electrodomésticos, Tecnología, Hogar y Aire Libre.
- **Sección Institucional (Sobre Nosotros)**: Presentación de la marca y fachada del showroom.
- **Testimonios de Clientes**: Opiniones reales de compradores y sistema de valoración con estrellas.
- **Productos Destacados & Nuevos Ingresos**:
  - Filtros interactivos por categoría (Electrodomésticos, Tecnología, Hogar, Aire Libre, Ofertas).
  - Ordenamiento por precio (menor/mayor) y calificaciones.
  - Vista rápida con modal de especificaciones técnicas y cuotas bancarias.
- **Lógica Completa de E-Commerce**:
  - **Carrito Lateral (Slide-out)** con persistencia en `localStorage`.
  - Barra de progreso para **Envío Gratis** (a partir de $500.000).
  - Sistema de cupones de descuento (`BC10`, `BIENVENIDA`).
  - **Checkout en 3 Pasos**: formulario de entrega, pasarela de pago simulada (Mercado Pago, Tarjeta, Transferencia, Efectivo) y confirmación con código de seguimiento y recibo imprimible.
- **Atención al Cliente**: Acordeón de preguntas frecuentes (FAQ) y simulador de chat interactivo por WhatsApp.
- **Newsletter**: Formulario con validación y entrega de código de descuento.

## 🛠️ Tecnologías

- **HTML5 & CSS3**: Vanilla CSS con sistema de diseño modular, variables CSS y tipografías optimizadas (Plus Jakarta Sans & Inter).
- **JavaScript Moderno (ES Modules)**: Arquitectura reactiva y gestión de estado sin dependencias pesadas.
- **Vite**: Entorno de desarrollo ultrarrápido y empaquetador de producción.

## 📦 Instalación y Ejecución Local

```bash
# Clonar repositorio
git clone https://github.com/munozalbelonicolas/BC.git
cd BC

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build
```
