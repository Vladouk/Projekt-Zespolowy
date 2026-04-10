# ETAP1.md - Etap 1: Inicjacja Projektu i Analiza Wymagań

## ✅ Zakończone

### 1. Inicjacja Projektu
- [x] Nazwa projektu: Delivery Manager
- [x] Zespół utworzony
- [x] Role przypisane
- [x] Repozytorium GitHub: https://github.com/Vladouk/Projekt-Zespolowy
- [x] Kanban Board: https://miro.com/app/board/uXjVGuydg84=/?share_link_id=82676155054
- [x] Stos technologiczny wybrany

### 2. Analiza Wymagań

#### Wymagania Funkcjonalne
- [x] WF001: Dodawanie zamówienia - **Must** - ✅ Ukończono
- [x] WF002: Zmiana statusu zamówienia - **Must** - ✅ Ukończono
- [x] WF003: Lista zamówień - **Must** - ✅ Ukończono
- [x] WF004: Usuwanie zamówienia - **Should** - ✅ Ukończono
- [x] WF005: Filtowanie zamówień - **Should** - ✅ Ukończono
- [x] WF006: Tryb offline - **Could** - ✅ Ukończono

#### Wymagania Niefunkcjonalne
- [x] WN001: Szybkie działanie aplikacji - **Wydajność** - ✅ <1s load time
- [x] WN002: Prosty interfejs UX - **UX** - ✅ Responsywny design
- [x] WN003: Praca offline - **Dostępność** - ✅ Service Worker + IndexedDB
- [x] WN004: Instalacja jako PWA - **Dostępność** - ✅ Web App Manifest

### 3. Historyjki Użytkownika
- [x] HU001: Jako kurier chcę widzieć listę zamówień
- [x] HU002: Jako kurier chcę zmieniać status zamówienia
- [x] HU003: Jako kurier chcę dodawać nowe zamówienia
- [x] HU004: Jako kurier chcę usuwać zamówienia

## 📊 Stos Technologiczny

### Frontend
- **HTML5** - struktura semantyczna
- **CSS3** - styling z mediaqueries
- **JavaScript** - logika aplikacji
- **Service Worker** - offline support
- **IndexedDB** - lokalne przechowywanie

### Backend
- **Python 3.8+** - runtime
- **Flask 2.3.3** - web framework
- **Flask-CORS** - CORS support
- **SQLite 3** - baza danych

### DevOps
- **Docker** - konteneryzacja
- **Docker Compose** - orchestration
- **Nginx** - reverse proxy
- **Git** - version control

## 📁 Struktura Projektu

```
delivery-manager/
├── frontend/                 # Aplikacja webowa
│   ├── index.html           # Główna strona
│   ├── manifest.json        # PWA manifest
│   ├── sw.js                # Service Worker
│   ├── styles/
│   │   └── style.css        # Styling
│   └── js/
│       ├── app.js           # Logika aplikacji
│       ├── api.js           # API client
│       └── offline.js       # Offline management
├── backend/                 # API serwer
│   ├── app.py              # Flask app
│   ├── Dockerfile          # Docker config
│   └── requirements.txt    # Python deps
├── docker-compose.yml      # Orchestration
├── nginx.conf              # Nginx config
├── setup.sh               # Setup script
├── README.md              # Dokumentacja
├── DEVELOPMENT.md         # Dev guide
├── TESTING.md            # Test plan
├── CHANGELOG.md          # Historia zmian
└── .gitignore           # Git ignore rules
```

## 🎯 Metryki Etapu 1

| Metryka | Target | Faktycznie | Status |
|---------|--------|-----------|--------|
| Wymagania zdefiniowane | 100% | 100% | ✅ |
| User Stories | 4+ | 4 | ✅ |
| Architektura zaplanowana | Tak | Tak | ✅ |
| Technologia wybrana | 6+ | 6 | ✅ |
| Dokumentacja | 80%+ | 90% | ✅ |

## 📝 Notatki

### Decyzje Projektowe
1. **PWA zamiast nativnego app** - łatwiejsze wdrażanie, universal support
2. **SQLite zamiast PostgreSQL** - prostota dla małego projektu
3. **Vanilla JS zamiast Framework'u** - mniejszy bundle, szybsze loading
4. **Flask zamiast Node.js** - Team umie Python

### Ryzyka i Zagrożenia
- **Ryzyka**: Brak doświadczenia z PWA
  - **Prawdopodobieństwo**: Średnie
  - **Wpływ**: Średni
  - **Działania**: Dokumentacja, research, POC

- **Ryzyka**: Problemy z kompatybilnością przeglądarek
  - **Prawdopodobieństwo**: Niskie
  - **Wpływ**: Średni
  - **Działania**: Cross-browser testing

## ✅ Checklisty Etapu 1

### Inicjacja
- [x] Zespół złożony
- [x] Role przydzielone
- [x] Repozytorium utworzone
- [x] Tablica Kanban skonfigurowana
- [x] Konwencje nazewnictwa ustalone

### Analiza
- [x] Wymagania zebrane
- [x] Historyjki użytkownika napisane
- [x] Akceptacyjne kryteria zdefiniowane
- [x] Ryzyka zidentyfikowane
- [x] Mitygacja zaplanowana

### Planowanie
- [x] Stos techniczny wybrany
- [x] Architektura zaplanowana
- [x] Timeline ustalone
- [x] Zasoby przydzielone
- [x] Plan komunikacji stworzony

## 📞 Kontakt

**Lider Projektu**: Vladyslav Khanchych (96011)
**Email**: 0986228770v@gmail.com
**GitHub**: [@Vladouk](https://github.com/Vladouk)

## 📅 Plan Następnego Etapu (Etap 2)

- [ ] Projekt UI/UX w Figma
- [ ] Wireframes kluczowych ekranów
- [ ] Mapa nawigacji
- [ ] Decyzje projektowe UX
- [ ] Prototypowanie interakcji

**Planowana data**: 15.04.2026
**Oczekiwany czas**: 1 tydzień
