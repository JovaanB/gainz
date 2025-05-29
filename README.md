# 🏋️ FitnessApp - MVP

Une application mobile de suivi d'entraînement simple et efficace, construite avec React Native et Expo.

## 🎯 Fonctionnalités

### Pour les sportifs

- ✅ **Entraînement en temps réel** - Saisie rapide des performances
- ✅ **Interface minimaliste** - Optimisée pour la salle de sport
- ✅ **Timer de repos automatique** - Avec vibration
- ✅ **Historique des performances** - Graphiques et statistiques
- ✅ **Stockage local** - Fonctionne hors ligne

### Fonctionnalités techniques

- ✅ **React Native + Expo** - Développement rapide
- ✅ **Expo Router** - Navigation moderne
- ✅ **Zustand** - Gestion d'état simple
- ✅ **AsyncStorage** - Persistance locale
- ✅ **TypeScript** - Code robuste
- ✅ **Responsive Design** - Interface adaptative

## 🚀 Installation

### Prérequis

- Node.js 18+
- Expo CLI
- Simulateur iOS/Android ou appareil physique

### Lancement

```bash
# Installation des dépendances
npm install

# Lancement du serveur de développement
npx expo start

# Lancement sur simulateur
npx expo start --ios
# ou
npx expo start --android
```

## 📱 Écrans

1. **Home** - Vue d'ensemble et statistiques
2. **Nouvelle séance** - Sélection d'exercices avec recherche
3. **Entraînement actif** - Saisie temps réel des performances
4. **Historique** - Graphiques de progression et détails
5. **Détail séance** - Vue complète d'un entraînement

## 🛠 Architecture

```
src/
├── app/                 # Écrans (Expo Router)
│   ├── (tabs)/         # Navigation par onglets
│   └── workout/        # Écrans d'entraînement
├── components/          # Composants réutilisables
│   ├── ui/             # Composants UI génériques
│   └── workout/        # Composants spécifiques workout
├── store/              # État global (Zustand)
├── services/           # Services (Storage, etc.)
├── hooks/              # Hooks personnalisés
├── types/              # Types TypeScript
├── utils/              # Utilitaires
└── data/               # Données statiques
```

## 📊 Stack Technique

- **Frontend**: React Native, Expo
- **Navigation**: Expo Router
- **État**: Zustand
- **Storage**: AsyncStorage
- **Styling**: StyleSheet natif
- **Icons**: Expo Vector Icons
- **Notifications**: Expo Haptics
- **Persistance**: Expo Keep Awake

## 🎨 Design System

### Couleurs

- **Couleur principale**: `#007AFF` (iOS Blue)
- **Couleurs secondaires**:
  - Success: `#34C759`
  - Error: `#FF3B30`
  - Warning: `#FF9500`
- **Couleurs neutres**:
  - Text: `#1C1C1E`
  - Secondary Text: `#8E8E93`
  - Background: `#F8F9FA`

### Typographie

- **Système**: SF Pro (iOS), Roboto (Android)
- **Tailles**: 12, 13, 14, 15, 16, 18, 20, 24, 28px
- **Poids**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Espacement

- **Base**: 4, 8, 12, 16, 20, 24, 32, 40px
- **Border Radius**: 6, 8, 12px

## 🗃️ Structure des Données

### Types principaux

```typescript
interface Workout {
  id: string;
  name: string;
  started_at: number;
  finished_at?: number;
  exercises: WorkoutExercise[];
}

interface WorkoutExercise {
  id: string;
  exercise: Exercise;
  sets: WorkoutSet[];
  order_index: number;
}

interface WorkoutSet {
  reps?: number;
  weight?: number;
  completed: boolean;
  rest_seconds?: number;
}
```

## 🔄 Flux de données

1. **Création séance** → Sélection exercices → Zustand Store
2. **Entraînement** → Saisie temps réel → Store local
3. **Fin séance** → AsyncStorage → Historique
4. **Consultation** → Lecture AsyncStorage → Affichage

## 🧪 Qualité du Code

### Standards

- **TypeScript strict** activé
- **ESLint** configuration Expo
- **Naming conventions** cohérentes
- **Error boundaries** pour la robustesse

### Performance

- **Memoization** des composants lourds
- **Lazy loading** des écrans
- **Optimisation images** et assets
- **Offline-first** architecture

## 🔄 Roadmap

### Phase 2 - Coach Platform

- [ ] Application web pour coachs
- [ ] Marketplace de programmes d'entraînement
- [ ] Système d'abonnements
- [ ] Suivi client temps réel

### Phase 3 - Fonctionnalités avancées

- [ ] Synchronisation cloud (Supabase)
- [ ] Challenges communautaires
- [ ] IA pour suggestions d'exercices
- [ ] Intégration wearables (Apple Watch, etc.)
- [ ] Mode hors ligne complet
- [ ] Partage sur réseaux sociaux

### Améliorations techniques

- [ ] Tests unitaires (Jest)
- [ ] Tests d'intégration (Detox)
- [ ] CI/CD Pipeline (GitHub Actions)
- [ ] Monitoring (Sentry)
- [ ] Analytics (Amplitude)

## 🧪 Tests

```bash
# Tests unitaires (à implémenter)
npm test

# Tests E2E (à implémenter)
npm run test:e2e

# Linting
npm run lint
```

## 🚀 Déploiement

### Development

```bash
# Serveur de développement
npx expo start

# Preview builds
npx expo start --tunnel
```

### Production

#### Configuration EAS

```bash
# Installation EAS CLI
npm install -g eas-cli

# Configuration initiale
eas build:configure

# Build pour les stores
eas build --platform all

# Soumission aux stores
eas submit --platform all
```

#### Variables d'environnement

```bash
# .env.local (non commité)
EXPO_PUBLIC_API_URL=https://api.example.com
SENTRY_DSN=your-sentry-dsn
```

## 📈 Métriques MVP

### Objectifs Phase 1

- [ ] 100 utilisateurs actifs
- [ ] 80% rétention J+7
- [ ] <2s temps de chargement
- [ ] 0 crash critique

### KPIs suivis

- Séances créées par utilisateur
- Temps moyen par séance
- Exercices favoris
- Fréquence d'utilisation

## 🤝 Contribution

### Workflow

1. Fork le projet
2. Crée une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit tes changements (`git commit -m 'feat: ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvre une Pull Request

### Conventions

- **Commits**: Conventional Commits (`feat:`, `fix:`, `docs:`, etc.)
- **Branches**: `feature/`, `bugfix/`, `hotfix/`
- **PRs**: Template avec description, tests, captures d'écran

## 🐛 Issues connues

- [ ] Timer de repos peut être imprécis en arrière-plan (iOS)
- [ ] Recherche d'exercices pourrait être plus rapide
- [ ] Graphiques pourraient être plus interactifs

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

```
MIT License

Copyright (c) 2025 FitnessApp

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

## 🙏 Remerciements

- **Expo Team** - Pour l'excellent framework
- **React Native Community** - Pour les composants et outils
- **Design inspiration** - Apple Fitness, Strong, Jefit
- **Beta testers** - Pour les retours précieux

## 👨‍💻 Auteur

Développé avec ❤️ pour la communauté fitness.

**Contact**: [ton-email@example.com]  
**Twitter**: [@tonhandle]  
**LinkedIn**: [ton-profil]

---

**Note**: Ce projet est un MVP (Minimum Viable Product) créé à des fins éducatives et de démonstration. Il est prêt pour être étendu vers une application complète.

## 📝 Changelog

### v1.0.0-mvp (2025-01-XX)

- ✅ Interface utilisateur complète
- ✅ Entraînement temps réel
- ✅ Stockage local persistant
- ✅ Historique et statistiques
- ✅ Architecture scalable

### Prochaines versions

- v1.1.0 - Améliorations UX et corrections
- v1.2.0 - Synchronisation cloud
- v2.0.0 - Plateforme coach
