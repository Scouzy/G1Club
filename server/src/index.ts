import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import prisma from './utils/prisma';

dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import categoryRoutes from './routes/categoryRoutes';
import sportifRoutes from './routes/sportifRoutes';
import trainingRoutes from './routes/trainingRoutes';
import annotationRoutes from './routes/annotationRoutes';
import evaluationRoutes from './routes/evaluationRoutes';
import messageRoutes from './routes/messageRoutes';
import statsRoutes from './routes/statsRoutes';
import coachRoutes from './routes/coachRoutes';
import scheduleRoutes from './routes/scheduleRoutes';
import clubRoutes from './routes/clubRoutes';
import teamRoutes from './routes/teamRoutes';
import announcementRoutes from './routes/announcementRoutes';
import licenceRoutes from './routes/licenceRoutes';
import stageRoutes from './routes/stageRoutes';

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/sportifs', sportifRoutes);
app.use('/api/trainings', trainingRoutes);
app.use('/api/annotations', annotationRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/coaches', coachRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/club', clubRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/licences', licenceRoutes);
app.use('/api/stages', stageRoutes);

app.get('/', (req, res) => {
  res.send('SportEmergence API is running');
});

const startServer = async () => {
  try {
    // Dynamic imports for AdminJS
    const { default: AdminJS } = await import('adminjs');
    const { default: AdminJSExpress } = await import('@adminjs/express');
    const AdminJSPrisma = await import('@adminjs/prisma');
    const { default: session } = await import('express-session');
    const { dark, light, noSidebar } = await import('@adminjs/themes');

    // Extract Adapter Components handling potential ESM/CJS interop
    const Database = AdminJSPrisma.Database || (AdminJSPrisma as any).default?.Database;
    const Resource = AdminJSPrisma.Resource || (AdminJSPrisma as any).default?.Resource;
    const getModelByName = AdminJSPrisma.getModelByName || (AdminJSPrisma as any).default?.getModelByName;

    if (!Database || !Resource || !getModelByName) {
      throw new Error('Failed to import Database, Resource, or getModelByName from @adminjs/prisma');
    }

    console.log('AdminJS Adapter imported successfully.');
    AdminJS.registerAdapter({ Database, Resource });
    console.log('AdminJS Adapter registered.');

    // Session setup (Required for AdminJS)
    app.use(session({
      secret: process.env.JWT_SECRET || 'secret',
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
      }
    }));

    // AdminJS Options
    const adminOptions = {
      resources: [
        { resource: { model: getModelByName('User'), client: prisma }, options: { navigation: { name: 'Gestion Utilisateurs', icon: 'User' }, properties: { password: { isVisible: false } } } },
        {
            resource: { model: getModelByName('Coach'), client: prisma },
            options: {
                navigation: { name: 'Gestion Sportive', icon: 'Users' },
                properties: {
                    bio: { type: 'textarea' },
                    qualifications: { type: 'textarea' },
                    experience: { type: 'textarea' }
                }
            }
        },
        { resource: { model: getModelByName('Sportif'), client: prisma }, options: { navigation: { name: 'Gestion Sportive', icon: 'User' } } },
        { resource: { model: getModelByName('Team'), client: prisma }, options: { navigation: { name: 'Gestion Sportive', icon: 'Users' } } },
        { resource: { model: getModelByName('Category'), client: prisma }, options: { navigation: { name: 'Paramètres', icon: 'List' } } },
        {
            resource: { model: getModelByName('Training'), client: prisma },
            options: {
                navigation: { name: 'Gestion Sportive', icon: 'Calendar' },
                properties: {
                    objectives: { type: 'textarea' },
                    report: { type: 'textarea' }
                }
            }
        },
        { resource: { model: getModelByName('Attendance'), client: prisma }, options: { navigation: { name: 'Suivi', icon: 'CheckSquare' } } },
        { resource: { model: getModelByName('Annotation'), client: prisma }, options: { navigation: { name: 'Suivi', icon: 'FileText' } } },
        { resource: { model: getModelByName('Evaluation'), client: prisma }, options: { navigation: { name: 'Suivi', icon: 'Activity' } } },
        { resource: { model: getModelByName('Message'), client: prisma }, options: { navigation: { name: 'Communication', icon: 'MessageSquare' } } },
        { resource: { model: getModelByName('Licence'), client: prisma }, options: { navigation: { name: 'Gestion Paiements', icon: 'CreditCard' } } },
        { resource: { model: getModelByName('LicencePayment'), client: prisma }, options: { navigation: { name: 'Gestion Paiements', icon: 'CreditCard' } } },
        { resource: { model: getModelByName('Stage'), client: prisma }, options: { navigation: { name: 'Gestion Paiements', icon: 'CreditCard' } } },
        { resource: { model: getModelByName('StageParticipant'), client: prisma }, options: { navigation: { name: 'Gestion Paiements', icon: 'CreditCard' } } },
        { resource: { model: getModelByName('StagePayment'), client: prisma }, options: { navigation: { name: 'Gestion Paiements', icon: 'CreditCard' } } },
      ],
      locale: {
        language: 'fr',
        translations: {
          labels: {
            User: 'Utilisateurs',
            Coach: 'Coachs',
            Sportif: 'Sportifs',
            Category: 'Catégories',
            Training: 'Evénements',
            Attendance: 'Présences',
            Annotation: 'Annotations',
            Evaluation: 'Évaluations',
            Message: 'Messages',
            Licence: 'Licences',
            LicencePayment: 'Paiements Licences',
            Stage: 'Stages',
            StageParticipant: 'Participants',
            StagePayment: 'Paiements Stages',
          },
          resources: {
            User: {
                properties: {
                    email: 'Email',
                    name: 'Nom',
                    role: 'Rôle',
                    createdAt: 'Créé le',
                    updatedAt: 'Mis à jour le',
                    password: 'Mot de passe'
                }
            },
            Sportif: {
                properties: {
                    firstName: 'Prénom',
                    lastName: 'Nom',
                    birthDate: 'Date de naissance',
                    height: 'Taille (cm)',
                    weight: 'Poids (kg)',
                    position: 'Poste',
                    categoryId: 'Catégorie',
                    userId: 'Utilisateur lié'
                }
            },
            Coach: {
                properties: {
                    userId: 'Utilisateur lié',
                    phone: 'Téléphone',
                    address: 'Adresse',
                    qualifications: 'Qualifications',
                    experience: 'Expérience',
                    bio: 'Biographie',
                    specialties: 'Spécialités',
                    photoUrl: 'Photo URL'
                }
            },
            Category: {
                properties: {
                    name: 'Nom'
                }
            },
            Training: {
                properties: {
                    date: 'Date',
                    duration: 'Durée (min)',
                    type: 'Type',
                    objectives: 'Objectifs',
                    report: 'Rapport',
                    categoryId: 'Catégorie',
                    coachId: 'Coach',
                    location: 'Lieu',
                    opponent: 'Adversaire',
                    result: 'Résultat'
                }
            },
            Attendance: {
                properties: {
                    present: 'Présent',
                    reason: 'Motif',
                    trainingId: 'Entraînement',
                    sportifId: 'Sportif'
                }
            },
            Annotation: {
                properties: {
                    content: 'Contenu',
                    type: 'Type',
                    createdAt: 'Créé le',
                    coachId: 'Coach',
                    sportifId: 'Sportif'
                }
            },
            Evaluation: {
                properties: {
                    date: 'Date',
                    type: 'Type',
                    ratings: 'Notes',
                    comment: 'Commentaire',
                    sportifId: 'Sportif',
                    coachId: 'Coach'
                }
            },
            Message: {
                properties: {
                    content: 'Contenu',
                    createdAt: 'Envoyé le',
                    senderId: 'Expéditeur',
                    receiverId: 'Destinataire'
                }
            }
          }
        }
      },
      rootPath: '/admin',
      branding: {
        companyName: 'Espace Dirigeant',
        withMadeWithLove: false,
      },
      defaultTheme: dark.id,
      availableThemes: [dark, light, noSidebar],
    };

    const admin = new AdminJS(adminOptions);
    const adminRouter = AdminJSExpress.buildRouter(admin);
    app.use(admin.options.rootPath, adminRouter);

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log(`AdminJS started on http://localhost:${port}/admin`);
    });

  } catch (error: any) {
    console.error('Failed to start server:', error);
  }
};

startServer();
