# C-DAC QMS — Refactored React Structure

This version keeps the same UI classes and CSS from the supplied project, but splits the large `main.jsx` into readable, reusable components.

## Structure

```text
src/
├── components/
│   ├── common/
│   ├── dashboard/
│   ├── layout/
│   ├── login/
│   ├── tables/
│   └── tasks/
├── context/
├── data/
├── pages/
├── routes/
├── App.jsx
├── main.jsx
└── index.css
```

## Install required packages

```bash
npm install lucide-react react-router-dom
```

## Run

```bash
npm run dev
```

## Important

`index.css` is intentionally kept as the same styling source so the visual design is not changed.
The main improvement is component separation and reusable structure.
