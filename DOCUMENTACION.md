# Documentación del Proyecto - TecnoNova E-Commerce

Este documento describe la arquitectura, características y las historias de usuario bajo metodología SCRUM del sistema de tienda digital **TecnoNova**.

---

## 1. Descripción del Sistema

**TecnoNova** es una plataforma web de comercio electrónico (E-commerce) especializada en hardware y componentes de computación de alto rendimiento. El sistema consta de un servidor de backend robusto con APIs RESTful estructurado bajo **Arquitectura Limpia (Clean Architecture)** y **Diseño Guiado por el Dominio (DDD)**, respaldado por una base de datos relacional autónoma **SQLite** y una interfaz web (frontend) SPA (*Single Page Application*) altamente interactiva con diseño moderno de estilo oscuro y animaciones fluidas.

### ¿Qué hace el sistema? (Funcionalidades Principales)
1. **Catálogo de Componentes**: Muestra una galería interactiva con la información detallada de los productos y sus respectivos estados de stock en tiempo real.
2. **Carrito de Compras Reactivo**: Permite a los usuarios añadir, restar o remover productos de su carrito de compras local, bloqueando la adición si se excede el stock disponible. El carrito persiste de forma local (`localStorage`).
3. **Gestión de Órdenes**: Permite simular y confirmar compras en un solo clic. El backend valida el inventario en la base de datos, reduce el stock físico de forma segura y genera una orden de compra detallada.
4. **Historial de Compras**: Un registro cronológico de las compras hechas por el cliente que detalla el costo total, ítems adquiridos, fecha y estado de la orden.
5. **Panel de Administración de Inventario**: Una interfaz administrativa protegida que permite al personal de la tienda añadir nuevos productos (definiendo ID, nombre, descripción, precio y stock inicial) y eliminar productos obsoletos de la base de datos.

---

## 2. Arquitectura de Software y Stack Tecnológico

El sistema sigue los principios de **Clean Architecture**, dividiendo la lógica en capas para asegurar que el núcleo de negocio sea independiente de detalles de infraestructura (bases de datos, web, etc.).

### Stack de Tecnología:
* **Backend (Servidor)**: Node.js con TypeScript, utilizando Express.js para enrutar las APIs RESTful.
* **Base de Datos**: SQLite (`sqlite3` v5) integrada de manera local en el archivo `database.sqlite` con persistencia relacional.
* **Frontend (Interfaz de Usuario)**: HTML5 semántico, CSS3 puro con diseño oscuro de estilo Glassmorphism y JavaScript nativo asíncrono para consumir las APIs del servidor en tiempo real.

---

## 3. Historias de Usuario (SCRUM)

A continuación se presentan las Historias de Usuario bajo el estándar de metodología ágil SCRUM, con su estructura correspondiente, criterios de aceptación y estimación de puntos de historia (*Story Points* basados en la escala Fibonacci).

---

### **Historia de Usuario 1: Visualización de Catálogo de Productos**
* **ID**: US-01
* **Título**: Visualización del catálogo de productos.
* **Descripción**: 
  > **Como** cliente de TecnoNova,  
  > **Quiero** ver un listado visual de todos los productos disponibles con sus descripciones, precios e indicador de stock,  
  > **Para** poder seleccionar los productos que deseo comprar.
* **Criterios de Aceptación**:
  * El sistema debe mostrar el nombre, descripción, precio formateado y disponibilidad de stock de cada producto.
  * Si un producto no cuenta con stock (stock = 0), el botón de "Añadir al Carrito" debe deshabilitarse automáticamente y mostrar el texto "Sin Stock".
  * La información del catálogo debe cargarse de forma dinámica mediante una petición asíncrona a la API `GET /api/products`.
* **Estimación**: 3 Story Points

---

### **Historia de Usuario 2: Gestión de Carrito de Compras**
* **ID**: US-02
* **Título**: Gestión del carrito de compras en la interfaz.
* **Descripción**: 
  > **Como** cliente de TecnoNova,  
  > **Quiero** añadir productos al carrito, modificar sus cantidades o eliminarlos desde una barra lateral deslizable,  
  > **Para** organizar los artículos que pretendo comprar antes de procesar el pago.
* **Criterios de Aceptación**:
  * Al hacer clic en "Añadir al Carrito" de un producto, este debe agregarse al panel del carrito y el contador de ítems superior debe incrementarse.
  * El usuario debe poder aumentar (`+`) o disminuir (`-`) la cantidad de un artículo directamente en el carrito.
  * Si la cantidad llega a `0`, el artículo debe desaparecer del carrito de compras.
  * El sistema debe calcular el subtotal y el total a pagar automáticamente a medida que se actualicen las cantidades.
  * El carrito debe guardar su estado localmente en el navegador (`localStorage`) para no perder la información al recargar la página.
* **Estimación**: 5 Story Points

---

### **Historia de Usuario 3: Procesamiento y Creación de Órdenes**
* **ID**: US-03
* **Título**: Creación de órdenes de compra con validación de stock.
* **Descripción**: 
  > **Como** cliente de TecnoNova,  
  > **Quiero** poder confirmar mi orden de compra desde el carrito de compras,  
  > **Para** asegurar la adquisición de mis productos de forma segura.
* **Criterios de Aceptación**:
  * Al hacer clic en "Confirmar Compra", se debe disparar una petición `POST /api/orders` con la lista de los productos y sus cantidades.
  * El backend debe validar que existe stock suficiente de cada producto solicitado en la base de datos SQLite antes de registrar la orden.
  * Si hay stock suficiente, el sistema debe restar las unidades del stock en la tabla `products` y guardar la orden de compra en las tablas `orders` y `order_items`.
  * Si la orden se procesa con éxito, el carrito de compras local debe limpiarse por completo y el cliente debe ser redirigido automáticamente al historial de compras.
  * Si hay un error de stock o conexión, se debe mostrar un mensaje toast de advertencia al usuario.
* **Estimación**: 8 Story Points

---

### **Historia de Usuario 4: Historial de Órdenes**
* **ID**: US-04
* **Título**: Consulta del historial de órdenes de compra.
* **Descripción**: 
  > **Como** cliente de TecnoNova,  
  > **Quiero** poder navegar a una pestaña dedicada que liste todas mis compras anteriores,  
  > **Para** llevar un control de mis pedidos y verificar los detalles de lo que compré.
* **Criterios de Aceptación**:
  * La vista debe activarse al hacer clic en el botón de navegación "Historial de Órdenes".
  * Cada tarjeta de orden debe mostrar el identificador único de la compra, la fecha y hora formateada, el estado de la compra (ej. PENDING, PAID), la lista detallada de los productos comprados con sus respectivas cantidades y precios, y el total pagado.
  * Si no hay órdenes registradas en el sistema, se debe mostrar un panel con el mensaje "No has realizado ninguna compra todavía".
  * Las órdenes deben consultarse en tiempo real a la API `GET /api/orders` ordenadas de la más reciente a la más antigua.
* **Estimación**: 3 Story Points

---

### **Historia de Usuario 5: Agregar Productos al Inventario (Administrador)**
* **ID**: US-05
* **Título**: Incorporación de nuevos productos al catálogo.
* **Descripción**: 
  > **Como** administrador de TecnoNova,  
  > **Quiero** contar con un formulario interactivo para registrar nuevos productos en el catálogo,  
  > **Para** mantener actualizada la oferta de productos en la tienda.
* **Criterios de Aceptación**:
  * El formulario debe contener campos obligatorios para: ID del producto, Nombre, Descripción, Precio y Stock inicial.
  * El sistema debe validar en el cliente y en el servidor que el ID del producto ingresado no exista previamente en la base de datos (clave primaria única).
  * Al guardar exitosamente a través de la API `POST /api/products`, los campos del formulario deben limpiarse, mostrar una confirmación toast y actualizar tanto el catálogo de ventas como la tabla de administración.
* **Estimación**: 5 Story Points

---

### **Historia de Usuario 6: Eliminar Productos del Catálogo (Administrador)**
* **ID**: US-06
* **Título**: Eliminación de productos obsoletos del inventario.
* **Descripción**: 
  > **Como** administrador de TecnoNova,  
  > **Quiero** poder eliminar cualquier producto de la tabla de inventario mediante un botón de acción rápida,  
  > **Para** retirar artículos descatalogados u obsoletos del sistema.
* **Criterios de Aceptación**:
  * En la tabla de administración de inventario, cada producto registrado debe contar con un botón "Eliminar" de color rojo.
  * Al pulsar "Eliminar", el sistema debe solicitar una confirmación al usuario para evitar borrados accidentales.
  * Si se confirma, se debe realizar una llamada a la API `DELETE /api/products/:id`.
  * El servidor debe borrar el registro de la base de datos SQLite y responder exitosamente.
  * Si el producto eliminado se encontraba dentro del carrito de compras activo de algún usuario, este debe desaparecer automáticamente para evitar compras inválidas.
* **Estimación**: 3 Story Points

---

## 4. Diagrama de Base de Datos (Esquema Físico)

A continuación se detalla la estructura relacional creada en el archivo SQLite (`database.sqlite`):

### Tabla: `products`
* `id` (TEXT, Primary Key) - Identificador único (ej: `prod-1`).
* `name` (TEXT, Not Null) - Nombre del componente.
* `description` (TEXT) - Descripción detallada.
* `price` (REAL, Not Null) - Precio unitario del producto.
* `stock` (INTEGER, Not Null) - Unidades físicas disponibles.

### Tabla: `orders`
* `id` (TEXT, Primary Key) - Identificador de la orden (ej: `order-1783525902507`).
* `total` (REAL, Not Null) - Monto total acumulado de la compra.
* `status` (TEXT, Not Null) - Estado de la transacción (PENDING, PAID, etc.).
* `created_at` (TEXT, Not Null) - Fecha y hora en formato ISO string.

### Tabla: `order_items`
* `id` (INTEGER, Primary Key, Autoincrement) - ID de registro.
* `order_id` (TEXT, Foreign Key -> `orders.id`) - Enlace a la cabecera del pedido.
* `product_id` (TEXT) - ID del producto comprado.
* `name` (TEXT) - Nombre del producto al momento de la compra.
* `price` (REAL) - Precio unitario del artículo cobrado.
* `quantity` (INTEGER) - Unidades compradas.
