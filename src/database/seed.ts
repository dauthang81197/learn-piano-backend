import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson, LessonType } from '../lessons/lesson.entity';
import { Quiz, QuestionType } from '../quiz/quiz.entity';
import { User, UserRole, SubscriptionType } from '../users/user.entity';
import { Course } from '../courses/course.entity';
import * as bcrypt from 'bcrypt';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const lessonsRepo = app.get<Repository<Lesson>>(getRepositoryToken(Lesson));
  const quizRepo = app.get<Repository<Quiz>>(getRepositoryToken(Quiz));
  const usersRepo = app.get<Repository<User>>(getRepositoryToken(User));
  const coursesRepo = app.get<Repository<Course>>(getRepositoryToken(Course));

  // -- Admin user --------------------------------------------------------------
  const existing = await usersRepo.findOne({
    where: { email: 'admin@learnpiano.com' },
  });
  if (!existing) {
    const admin = usersRepo.create({
      email: 'admin@learnpiano.com',
      passwordHash: await bcrypt.hash('Admin@123456', 10),
      name: 'Admin',
      role: UserRole.ADMIN,
      subscription: SubscriptionType.PREMIUM,
    });
    await usersRepo.save(admin);
    console.log('Admin user created: admin@learnpiano.com / Admin@123456');
  }

  // -- Courses ----------------------------------------------------------------
  const coursesData: Partial<Course>[] = [
    {
      title: 'Piano for Beginners',
      description:
        'Khóa học piano dành cho người mới bắt đầu hoàn toàn. ' +
        'Học từ cơ bản nhất: phím đàn, nốt nhạc, tư thế ngồi, đọc bản nhạc và các gam cơ bản.',
      thumbnail: null,
      isPremium: false,
      order: 1,
    },
    {
      title: 'Advanced Piano Techniques',
      description:
        'Nâng cao kỹ năng với hợp âm, hòa âm, kỹ thuật biểu diễn nâng cao. ' +
        'Dành cho học viên đã hoàn thành khóa Beginners.',
      thumbnail: null,
      isPremium: true,
      order: 2,
    },
  ];

  const savedCourses: Course[] = [];
  for (const data of coursesData) {
    const exists = await coursesRepo.findOne({ where: { title: data.title } });
    if (!exists) {
      const course = coursesRepo.create(data);
      const saved = await coursesRepo.save(course);
      savedCourses.push(saved);
      console.log(`Course created: ${saved.title}`);
    } else {
      savedCourses.push(exists);
    }
  }

  const beginnerCourse = savedCourses.find((c) => c.title === 'Piano for Beginners')!;
  const advancedCourse = savedCourses.find((c) => c.title === 'Advanced Piano Techniques')!;

  // -- Lessons -----------------------------------------------------------------
  const lessonsData: Partial<Lesson>[] = [
    {
      title: 'Introduction to Piano',
      content:
        '## Welcome to Piano Learning!\nThe piano is one of the most versatile instruments. ' +
        'In this lesson, you will learn about the keyboard layout, the names of the keys, and basic hand positioning.',
      type: LessonType.THEORY,
      xpReward: 10,
      order: 1,
      isPremium: false,
      quizIds: [],
      courseId: beginnerCourse.id,
    },
    {
      title: 'Reading Sheet Music Basics',
      content:
        '## Sheet Music Fundamentals\nLearn to read the treble and bass clef, note names, ' +
        'and basic rhythm values (whole, half, quarter, eighth notes).',
      type: LessonType.THEORY,
      xpReward: 15,
      order: 2,
      isPremium: false,
      quizIds: [],
      courseId: beginnerCourse.id,
    },
    {
      title: 'Major Scales',
      content:
        '## Major Scales\nMaster the C, G, D, and F major scales. ' +
        'Learn the formula: W-W-H-W-W-W-H (Whole & Half steps).',
      type: LessonType.QUIZ,
      xpReward: 20,
      order: 3,
      isPremium: false,
      quizIds: [],
      courseId: beginnerCourse.id,
    },
    {
      title: 'Piano Fundamentals Quiz',
      content:
        '## Test Your Piano Knowledge\nThis comprehensive quiz covers keyboard layout, music theory basics, ' +
        'scales, chords, rhythm, and dynamics. Answer all 10 questions to earn XP!',
      type: LessonType.QUIZ,
      xpReward: 50,
      order: 4,
      isPremium: false,
      quizIds: [],
      courseId: beginnerCourse.id,
    },
    {
      title: 'Chords & Harmony',
      content:
        '## Introduction to Chords\nLearn major and minor triads, how to build them from any root note, ' +
        'and basic chord progressions (I-IV-V-I).',
      type: LessonType.QUIZ,
      xpReward: 25,
      order: 1,
      isPremium: true,
      quizIds: [],
      courseId: advancedCourse.id,
    },
    {
      title: 'Advanced Techniques',
      content:
        '## Advanced Piano Techniques\nLegato, staccato, dynamics (piano/forte), ' +
        'pedaling techniques, and ornaments (trills, mordents).',
      type: LessonType.THEORY,
      xpReward: 30,
      order: 2,
      isPremium: true,
      quizIds: [],
      courseId: advancedCourse.id,
    },
  ];

  const savedLessons: Lesson[] = [];
  for (const data of lessonsData) {
    const exists = await lessonsRepo.findOne({ where: { title: data.title } });
    if (!exists) {
      const lesson = lessonsRepo.create(data);
      const saved = await lessonsRepo.save(lesson);
      savedLessons.push(saved);
      console.log(`Lesson created: ${saved.title}`);
    } else {
      savedLessons.push(exists);
    }
  }

  // -- Quizzes -----------------------------------------------------------------
  const majorScalesLesson = savedLessons.find((l) => l.title === 'Major Scales');
  const chordsLesson = savedLessons.find((l) => l.title === 'Chords & Harmony');

  if (majorScalesLesson) {
    const existingQuiz = await quizRepo.findOne({
      where: { lessonId: majorScalesLesson.id },
    });
    if (!existingQuiz) {
      const quiz = quizRepo.create({
        lessonId: majorScalesLesson.id,
        xpReward: 20,
        questions: [
          {
            id: 'q1',
            type: QuestionType.MULTIPLE_CHOICE,
            question: 'How many notes are in a major scale?',
            options: ['5', '7', '8', '12'],
            answer: '8',
          },
          {
            id: 'q2',
            type: QuestionType.MULTIPLE_CHOICE,
            question: 'What is the first note of the C major scale?',
            options: ['D', 'E', 'C', 'G'],
            answer: 'C',
          },
          {
            id: 'q3',
            type: QuestionType.FILL_BLANK,
            question: 'The pattern of steps in a major scale is W-W-H-W-W-W-___',
            options: [],
            answer: 'H',
          },
        ],
      });
      await quizRepo.save(quiz);
      console.log(`Quiz created for: ${majorScalesLesson.title}`);
    }
  }

  if (chordsLesson) {
    const existingQuiz = await quizRepo.findOne({
      where: { lessonId: chordsLesson.id },
    });
    if (!existingQuiz) {
      const quiz = quizRepo.create({
        lessonId: chordsLesson.id,
        xpReward: 25,
        questions: [
          {
            id: 'q1',
            type: QuestionType.MULTIPLE_CHOICE,
            question: 'How many notes are in a basic triad chord?',
            options: ['2', '3', '4', '5'],
            answer: '3',
          },
          {
            id: 'q2',
            type: QuestionType.MULTIPLE_CHOICE,
            question: 'Which notes make up a C major chord?',
            options: ['C-D-E', 'C-E-G', 'C-F-A', 'C-E-A'],
            answer: 'C-E-G',
          },
          {
            id: 'q3',
            type: QuestionType.MULTIPLE_CHOICE,
            question: 'In a minor chord, which interval is flattened compared to major?',
            options: ['Root', 'Third', 'Fifth', 'Seventh'],
            answer: 'Third',
          },
        ],
      });
      await quizRepo.save(quiz);
      console.log(`Quiz created for: ${chordsLesson.title}`);
    }
  }

  // -- Piano Fundamentals Quiz: 10 questions -----------------------------------
  const fundamentalsLesson = savedLessons.find((l) => l.title === 'Piano Fundamentals Quiz');
  if (fundamentalsLesson) {
    const existingQuiz = await quizRepo.findOne({
      where: { lessonId: fundamentalsLesson.id },
    });
    if (!existingQuiz) {
      const quiz = quizRepo.create({
        lessonId: fundamentalsLesson.id,
        xpReward: 50,
        questions: [
          // Q1 - multiple choice
          {
            id: 'q1',
            type: QuestionType.MULTIPLE_CHOICE,
            question: 'How many keys does a standard piano have?',
            options: ['76', '88', '92', '96'],
            answer: '88',
          },
          // Q2 - multiple choice
          {
            id: 'q2',
            type: QuestionType.MULTIPLE_CHOICE,
            question: 'Which clef is typically used for the right hand in piano music?',
            options: ['Bass clef', 'Alto clef', 'Treble clef', 'Tenor clef'],
            answer: 'Treble clef',
          },
          // Q3 - multiple choice
          {
            id: 'q3',
            type: QuestionType.MULTIPLE_CHOICE,
            question: 'What does the musical term "forte" (f) mean?',
            options: ['Soft', 'Loud', 'Fast', 'Slow'],
            answer: 'Loud',
          },
          // Q4 - multiple choice
          {
            id: 'q4',
            type: QuestionType.MULTIPLE_CHOICE,
            question: 'How many semitones are in one octave?',
            options: ['7', '10', '12', '15'],
            answer: '12',
          },
          // Q5 - multiple choice
          {
            id: 'q5',
            type: QuestionType.MULTIPLE_CHOICE,
            question: 'Which of the following is the correct order of the musical alphabet?',
            options: ['A-B-C-D-E-F-G', 'A-B-C-D-E-F-G-H', 'C-D-E-F-G-A-B-C-D', 'A-C-D-E-F-G'],
            answer: 'A-B-C-D-E-F-G',
          },
          // Q6 - multiple choice
          {
            id: 'q6',
            type: QuestionType.MULTIPLE_CHOICE,
            question:
              'What is the time signature where there are 4 beats per measure and the quarter note gets one beat?',
            options: ['3/4', '6/8', '4/4', '2/2'],
            answer: '4/4',
          },
          // Q7 - fill in the blank
          {
            id: 'q7',
            type: QuestionType.FILL_BLANK,
            question: 'A half note receives ___ beats in common time (4/4).',
            options: [],
            answer: '2',
          },
          // Q8 - fill in the blank
          {
            id: 'q8',
            type: QuestionType.FILL_BLANK,
            question: 'The distance between C and E in the C major scale is called a major ___.',
            options: [],
            answer: 'third',
          },
          // Q9 - fill in the blank
          {
            id: 'q9',
            type: QuestionType.FILL_BLANK,
            question: 'Playing notes smoothly and connectedly is called ___.',
            options: [],
            answer: 'legato',
          },
          // Q10 - match (dynamic marking -> definition)
          {
            id: 'q10',
            type: QuestionType.MATCH,
            question: 'Match each dynamic marking to its meaning.',
            options: ['pp', 'mp', 'ff', 'mf'],
            answer: [
              'pianissimo (very soft)',
              'mezzo-piano (moderately soft)',
              'fortissimo (very loud)',
              'mezzo-forte (moderately loud)',
            ],
          },
        ],
      });
      await quizRepo.save(quiz);
      console.log(`Quiz created for: ${fundamentalsLesson.title} (10 questions)`);
    }
  }

  console.log('\nSeeding complete!');
  await app.close();
}

seed().catch((err: unknown) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
