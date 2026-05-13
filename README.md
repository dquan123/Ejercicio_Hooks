# Pomodoro Timer — React Hooks

Ejercicio práctico de **useState**, **useEffect** y **useRef** en React.  
Curso: Sistemas y Tecnologías Web 
Universidad del Valle de Guatemala

## Hooks utilizados

- `useState` — manejo de estado: tiempo, modo, sesiones y configuración
- `useEffect` — efectos secundarios: intervalo del timer, cambio de modo, sonido y sincronización
- `useRef` — referencia al intervalo sin causar re-renders

## Niveles implementados

**Nivel 1 — Timer básico**  
Timer de cuenta regresiva con inicio, pausa y reinicio. Implementa el intervalo con cleanup correcto.

**Nivel 2 — Modos trabajo/descanso**  
Alterna automáticamente entre 25 minutos de trabajo y 5 de descanso. Guarda un historial de sesiones completadas.

**Nivel 3 — Pomodoro completo**  
Configuración personalizable de tiempos, barra de progreso, sonido al completar sesión, estadísticas acumuladas y guardado de sesiones parciales.

## Cómo correrlo

```bash
npm install
npm run dev
```

Abrir http://localhost:5173 en el navegador.


## Link del video explicativo
https://youtu.be/EBhztjUJYdw
