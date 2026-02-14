# 🤖 Bot de Rol - Sistema de Fichas e Inventario

Bot desarrollado en Node.js para gestión de fichas de personajes, inventario y economía escalonada para grupos de rol.

---

## 📌 Características

- 📜 Creación y gestión de fichas
- 📦 Sistema de inventario por personaje
- 💎 Economía escalonada con conversión automática
- 🎲 Sistema de dados con detección de críticos
- 🛠 Administración de objetos, materiales y propiedades
- 📂 Estructura modular por comandos

---

## 💰 Sistema de Economía

El sistema de dinero funciona mediante **rombos de distinto valor**, donde:

- Cada rombo vale **6 veces más que el anterior**
- Cada rombo puede fragmentarse en **Falanges (F)**  
- 1 Falange = 1/6 de su rombo correspondiente

### Orden de valores:

| Nivel | Tipo | Relación |
|-------|------|----------|
| 🔷 | Azul | Base |
| 💠 | Celeste | 6 Azules |
| 🟪 | Rosa | 6 Celestes |
| ⭐ | Amarillo | 6 Rosas |
| 🔸 | Naranja | 6 Amarillos |
| ♦️ | Rojo | 6 Naranjas |

El sistema:
- Normaliza automáticamente al añadir dinero
- Fragmenta en cascada al quitar dinero
- Convierte automáticamente a valores mayores cuando es posible

---

## 📦 Estructura del Inventario

Cada personaje posee:

```
📦 Inventario
╰─► ❲ Dinero ❳
╰─► ❲ Objetos ❳
╰─► ❲ Materiales recolectados ❳
╰─► ❲ Propiedades ❳
╰─► ❲ Empresas ❳
╰─► ❲ Unidades de Comercio ❳
```

Los campos tipo objeto se guardan como:

```
NombreObjeto: descripcion
```

---

## 🎲 Comandos Disponibles

### 📁 Administración de Fichas e Inventario

- `/crear_ficha`
- `/mis_fichas`
- `/crear_inventario`
- `/ver_inventario`
- `/dinero`
- `/editar_inventario`

### 🎲 Utilidades

- `/dado`

### ℹ Comandos de Información

- `/help`

---

## 🎲 Sistema de Dados

Formato:

```
/dado XdY
```

Ejemplos:

```
/dado d20
/dado 2d10
/dado 3d4
```

Incluye:
- Total acumulado
- Indicador de crítico máximo
- Indicador de fallo crítico

```

## 🚀 Instalación

1. Clonar el repositorio:

```
git clone <url_del_repositorio>
```

2. Instalar dependencias:

```
npm install
```

3. Ejecutar el bot:

```
node index.js
```

---

```

## 📈 Roadmap Futuro

- Sistema de comercio entre jugadores
- Mercado automático
- Sistema de combate
- Sistema de experiencia y progresión
- Logs administrativos
- Panel web de gestión

---

## 👑 Autor Nekomaid7564

Desarrollado para sistema privado de rol.

---

> Proyecto en desarrollo activo.
