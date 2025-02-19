from typing import Dict, Any
from prisma import Prisma

class MockDataService:
    def __init__(self):
        self.db = Prisma()
        self._connected = False

    async def get_user_form_data(self) -> Dict[str, Any]:
        try:
            print("Connecting to database...")
            if not self._connected:
                await self.db.connect()
                self._connected = True
            
            print("Fetching resume data...")
            resume = await self.db.parsedresume.find_first(
                include={
                    'educations': True,
                    'workExperiences': True,
                    'skills': True,
                    'projects': True
                }
            )
            
            print("Resume data:", resume)

            if not resume:
                print("No resume found, using default data")
                return {
                    'firstName': 'John',
                    'lastName': 'Doe',
                    'email': 'john.doe@example.com',
                    'phone': '1234567890',
                    'gender': 'male',
                    'legal_authorization': 'yes',
                    'willing_to_relocate': 'yes',
                    'languages': ['English'],
                    'visa_sponsorship': 'yes',
                    'employment_type': 'full-time',
                    'work_schedule': 'monday-friday',
                    'remote_preference': 'hybrid',
                    'highest_degree': 'Bachelor',
                    'graduation_year': '2023',
                    'years_of_experience': '3',
                    'skills': ['JavaScript', 'Python'],
                    'salary_expectation': '100000',
                    'notice_period': '2 weeks',
                    'linkedin_url': 'https://linkedin.com/in/username'
                }

            # Combine DB data with hardcoded fields
            return {
                # From ParsedResume
                'firstName': resume.fullName.split(' ')[0] if resume.fullName else 'John',
                'lastName': ' '.join(resume.fullName.split(' ')[1:]) if resume.fullName else 'Doe',
                'email': resume.email,
                'phone': resume.phoneNumber,
                'address': resume.location,
                
                # Hardcoded fields
                'gender': 'male',
                'legal_authorization': 'yes',
                'willing_to_relocate': 'yes',
                'languages': ['English', 'Mandarin'],
                'visa_sponsorship': 'yes',
                'employment_type': 'full-time',
                'work_schedule': 'monday-friday',
                'remote_preference': 'hybrid',
                
                # Education summary
                'highest_degree': resume.educations[0].degree if resume.educations and len(resume.educations) > 0 else 'Bachelor',
                'graduation_year': resume.educations[0].date if resume.educations and len(resume.educations) > 0 else '2023',
                
                # Experience summary
                'years_of_experience': str(len(resume.workExperiences)),
                
                # Skills summary
                'skills': [skill.name for skill in resume.skills],
                
                # Additional fields
                'salary_expectation': '100000',
                'notice_period': '2 weeks',
                'linkedin_url': 'https://linkedin.com/in/username'
            }
        except Exception as e:
            print(f"Error in get_user_form_data: {e}")
            raise

    async def cleanup(self):
        if self._connected:
            await self.db.disconnect()
            self._connected = False

        return {} 