'use server';

import { PrismaClient } from '@prisma/client';
import type { Resume } from 'lib/redux/types';

const prisma = new PrismaClient();

export async function saveResume(resume: Resume) {
  try {
    const savedResume = await prisma.parsedResume.create({
      data: {
        fullName: resume.profile.name,
        email: resume.profile.email,
        phoneNumber: resume.profile.phone,
        location: resume.profile.location,
        summary: resume.profile.summary,
        workExperiences: {
          create: resume.workExperiences.map(work => ({
            company: work.company,
            jobTitle: work.jobTitle,
            date: work.date,
            descriptions: work.descriptions
          }))
        },
        educations: {
          create: resume.educations.map(edu => ({
            school: edu.school,
            degree: edu.degree,
            date: edu.date,
            gpa: edu.gpa,
            descriptions: edu.descriptions
          }))
        },
        skills: {
          create: resume.skills.descriptions.map(skill => ({
            name: skill
          }))
        }
      }
    });
    return savedResume.id;
  } catch (error) {
    console.error('Error saving resume:', error);
    throw error;
  }
} 