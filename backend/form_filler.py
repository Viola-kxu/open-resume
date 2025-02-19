import os
import time
from typing import Any, List, Optional, Tuple
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException, TimeoutException

class WebFormFiller:
    def __init__(self, driver: Any, user_data: dict):
        self.driver = driver
        self.user_data = user_data
        self.wait = WebDriverWait(self.driver, 10)

    def fill_form(self, url: str):
        self.driver.get(url)
        time.sleep(2)  # Wait for page to load
        success_count = 0
        error_count = 0

        try:
            # Click the Apply Now button if it exists
            try:
                apply_button = self.wait.until(
                    EC.element_to_be_clickable((By.CSS_SELECTOR, "button[data-action='click->application#submit']"))
                )
                apply_button.click()
                time.sleep(2)
                success_count += 1
            except Exception as e:
                print(f"Apply button error: {str(e)}")
                error_count += 1

            # Fill basic information fields
            fields_to_fill = [
                ("first_name", self.user_data['firstName']),
                ("last_name", self.user_data['lastName']),
                ("email", self.user_data['email']),
                ("phone", self.user_data['phone'])
            ]

            for field_id, value in fields_to_fill:
                try:
                    self._fill_input(field_id, value)
                    success_count += 1
                except Exception as e:
                    print(f"Error filling {field_id}: {str(e)}")
                    error_count += 1
                    continue

            # Fill LinkedIn URL
            try:
                linkedin_inputs = self.driver.find_elements(
                    By.CSS_SELECTOR, 
                    "input[type='text'][placeholder*='LinkedIn'], input[type='text'][aria-label*='LinkedIn']"
                )
                if linkedin_inputs:
                    linkedin_inputs[0].send_keys(self.user_data['linkedin_url'])
                    print("Filled LinkedIn URL")
                    success_count += 1
            except Exception as e:
                print(f"LinkedIn field error: {str(e)}")
                error_count += 1

            # Handle work authorization
            try:
                auth_selects = self.driver.find_elements(
                    By.CSS_SELECTOR,
                    "select[id*='work_authorization'], select[id*='legally_authorized']"
                )
                if auth_selects:
                    select = Select(auth_selects[0])
                    value = "Yes" if self.user_data['legal_authorization'].lower() == 'yes' else "No"
                    select.select_by_visible_text(value)
                    print(f"Selected work authorization: {value}")
                    success_count += 1
            except Exception as e:
                print(f"Work authorization error: {str(e)}")
                error_count += 1

            # Handle sponsorship
            try:
                sponsor_selects = self.driver.find_elements(
                    By.CSS_SELECTOR,
                    "select[id*='sponsor'], select[id*='visa']"
                )
                if sponsor_selects:
                    select = Select(sponsor_selects[0])
                    value = "Yes" if self.user_data['visa_sponsorship'].lower() == 'yes' else "No"
                    select.select_by_visible_text(value)
                    print(f"Selected sponsorship: {value}")
                    success_count += 1
            except Exception as e:
                print(f"Sponsorship field error: {str(e)}")
                error_count += 1

            # Fill additional information
            try:
                self._fill_textarea("cover_letter", 
                    f"I am a {self.user_data['years_of_experience']}-year experienced professional "
                    f"with a {self.user_data['highest_degree']} degree. "
                    f"My key skills include: {', '.join(self.user_data['skills'][:3])}."
                )
                success_count += 1
            except Exception as e:
                print(f"Cover letter error: {str(e)}")
                error_count += 1

            print(f"\nForm filling completed:")
            print(f"Successfully filled fields: {success_count}")
            print(f"Fields with errors: {error_count}")
            time.sleep(2)

        except Exception as e:
            print(f"Critical error in form filling: {str(e)}")
            return False
        
        return success_count > 0

    def _fill_input(self, field_id, value):
        """Helper method to fill input fields"""
        try:
            input_field = self.driver.find_element(By.ID, field_id)
            self._highlight_element(input_field)
            input_field.clear()
            input_field.send_keys(value)
            # Trigger events to ensure the webpage recognizes the changes
            self.driver.execute_script("""
                let element = arguments[0];
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
                element.dispatchEvent(new Event('blur', { bubbles: true }));
            """, input_field)
            print(f"Filled {field_id}: {value}")
            time.sleep(0.5)  # Wait for the webpage to process the change
        except NoSuchElementException:
            print(f"Field {field_id} not found")

    def _fill_textarea(self, field_id, value):
        """Helper method to fill textarea fields"""
        try:
            textarea = self.driver.find_element(By.ID, field_id)
            self._highlight_element(textarea)
            textarea.clear()
            textarea.send_keys(value)
            # Trigger events for textarea
            self.driver.execute_script("""
                let element = arguments[0];
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
                element.dispatchEvent(new Event('blur', { bubbles: true }));
            """, textarea)
            print(f"Filled {field_id}")
            time.sleep(0.5)
        except NoSuchElementException:
            print(f"Textarea {field_id} not found")

    def _highlight_element(self, element):
        """Highlight the element being filled for visibility"""
        self.driver.execute_script(
            "arguments[0].style.border = '2px solid red';"
            "arguments[0].style.backgroundColor = 'yellow';", 
            element
        )
        time.sleep(0.5)

    def _find_and_fill_inputs(self):
        # Find all input elements
        inputs = self.driver.find_elements(By.TAG_NAME, 'input')
        selects = self.driver.find_elements(By.TAG_NAME, 'select')
        textareas = self.driver.find_elements(By.TAG_NAME, 'textarea')

        for element in inputs + selects + textareas:
            try:
                self._analyze_and_fill_element(element)
            except Exception as e:
                print(f"Error filling element: {e}")

    def _analyze_and_fill_element(self, element):
        field_type = self._determine_field_type(element)
        if field_type and field_type in self.user_data:
            self._fill_field(element, self.user_data[field_type])

    def _determine_field_type(self, element) -> Optional[str]:
        hints = [
            element.get_attribute('id'),
            element.get_attribute('name'),
            element.get_attribute('aria-label'),
            element.get_attribute('placeholder'),
            element.get_attribute('class')
        ]
        hints = [h.lower() for h in hints if h]

        # Add associated label text if it exists
        try:
            label = self.driver.find_element(By.XPATH, f"//label[@for='{element.get_attribute('id')}']")
            hints.append(label.text.lower())
        except NoSuchElementException:
            pass

        field_matchers = {
            'firstName': ['first[_-]?name', 'given[_-]?name', 'fname'],
            'lastName': ['last[_-]?name', 'family[_-]?name', 'lname'],
            'email': ['email', 'e-mail'],
            'phone': ['phone', 'mobile', 'telephone'],
            'gender': ['gender', 'sex'],
            'legal_authorization': ['legally.*authoriz', 'work.*permit', 'authorized.*work'],
            'willing_to_relocate': ['relocate', 'relocation'],
            'languages': ['language', 'speak', 'written'],
            'visa_sponsorship': ['visa', 'sponsorship'],
            'employment_type': ['employment.*type', 'job.*type'],
            'work_schedule': ['schedule', 'availability'],
            'remote_preference': ['remote', 'work.*location'],
            'highest_degree': ['degree', 'education.*level'],
            'graduation_year': ['graduate.*year', 'graduation.*date'],
            'years_of_experience': ['years.*experience', 'experience.*years'],
            'skills': ['skills', 'technologies'],
            'salary_expectation': ['salary', 'compensation'],
            'notice_period': ['notice.*period', 'start.*date'],
            'linkedin_url': ['linkedin', 'social.*media']
        }

        for field_type, patterns in field_matchers.items():
            if any(pattern in hint for pattern in patterns for hint in hints):
                return field_type
        return None

    def _fill_field(self, element, value):
        element_type = element.get_attribute('type')
        tag_name = element.tag_name

        try:
            if tag_name == 'select':
                self._handle_select(element, value)
            elif element_type == 'radio':
                self._handle_radio(element, value)
            elif element_type == 'checkbox':
                self._handle_checkbox(element, value)
            else:
                element.clear()
                element.send_keys(value)
                time.sleep(0.5)
        except Exception as e:
            print(f"Error filling field: {e}")

    def _handle_select(self, element, value):
        try:
            select = Select(element)
            time.sleep(0.4)  # Wait for dropdown to be fully loaded

            # Check if already selected
            selected_option = select.first_selected_option.text.strip()
            if selected_option and selected_option != 'Select an option':
                print(f"Dropdown already selected ({selected_option}). Skipping...")
                return

            # Get all options
            options = [option.text.strip() for option in select.options]
            
            # Remove empty or placeholder options
            options = [opt for opt in options if opt and opt.lower() not in [
                'select an option', 'please select', 'choose', '--', 'select'
            ]]

            if not options:
                print("No valid options found in dropdown")
                return

            # Try to find best matching option
            best_match = None
            value_lower = value.lower()
            
            # First try exact match
            for option in options:
                if option.lower() == value_lower:
                    best_match = option
                    break
            
            # Then try contains match
            if not best_match:
                for option in options:
                    if value_lower in option.lower() or option.lower() in value_lower:
                        best_match = option
                        break
            
            # If still no match, use first non-empty option
            if not best_match and options:
                best_match = options[0]
                print(f"No match found for '{value}', using first option: '{best_match}'")

            if best_match:
                select.select_by_visible_text(best_match)
                # Trigger select events
                self.driver.execute_script("""
                    let element = arguments[0];
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                    element.dispatchEvent(new Event('blur', { bubbles: true }));
                """, element)
                time.sleep(0.5)
            else:
                print(f"Could not find suitable option for '{value}'")

        except NoSuchElementException:
            print("Dropdown element not found or not accessible")
        except Exception as e:
            print(f"Error handling dropdown: {e}")

    def _handle_radio(self, element, value):
        name = element.get_attribute('name')
        radio_group = self.driver.find_elements(By.NAME, name)
        for radio in radio_group:
            if value.lower() in radio.get_attribute('value').lower():
                radio.click()
                # Trigger radio events
                self.driver.execute_script("""
                    let element = arguments[0];
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                    element.dispatchEvent(new Event('click', { bubbles: true }));
                """, radio)
                break
            time.sleep(0.5)

    def _handle_checkbox(self, element, value):
        if isinstance(value, bool):
            if value and not element.is_selected():
                element.click()
            elif not value and element.is_selected():
                element.click() 