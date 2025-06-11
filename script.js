  const CONFIG = {
      EMAIL_RECIPIENTS: ['kpm0027@auburn.edu', 'eyedr90@aol.com', 'idr90@aol.com'],
      GOOGLE_SHEETS_URL: 'https://script.google.com/macros/s/AKfycbyQdGKEVAxeGbK4dcmDzkqSAmWL3qfSt53heyp_pkvFP SaiozSv1n5bgznsZP_6H9JK/exec',
      EMAILJS: {
          SERVICE_ID: 'service_fcb3jnj',
          TEMPLATE_ID: 'template_bikg09l',
          PUBLIC_KEY: 'LYsfhUe8MvlOQqsTq'
      }
  };

  // Initialize the application
  document.addEventListener('DOMContentLoaded', function() {
      // Initialize EmailJS
      if (CONFIG.EMAILJS.PUBLIC_KEY !== 'YOUR_EMAILJS_PUBLIC_KEY') {
          emailjs.init(CONFIG.EMAILJS.PUBLIC_KEY);
      }

      initializeForms();
      setCurrentDateTime();
  });

  // Initialize form event listeners
  function initializeForms() {
      const openingForm = document.getElementById('openingForm');
      const closingForm = document.getElementById('closingForm');

      openingForm.addEventListener('submit', handleOpeningSubmit);
      closingForm.addEventListener('submit', handleClosingSubmit);
  }

  // Show section function for navigation
  function showSection(sectionName) {
      // Hide all sections
      const sections = document.querySelectorAll('.section');
      sections.forEach(section => section.classList.remove('active'));

      // Remove active class from all tabs
      const tabs = document.querySelectorAll('.nav-tab');
      tabs.forEach(tab => tab.classList.remove('active'));

      // Show selected section
      document.getElementById(sectionName + 'Section').classList.add('active');
      document.getElementById(sectionName + 'Tab').classList.add('active');

      // Update current time for the active section
      setCurrentDateTime();
  }

  // Set current date and time as default values
  function setCurrentDateTime() {
      const now = new Date();
      const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);

      const openingTime = document.getElementById('openingTime');
      const closingTime = document.getElementById('closingTime');

      if (openingTime) openingTime.value = localDateTime;
      if (closingTime) closingTime.value = localDateTime;
  }

  // Handle opening form submission
  async function handleOpeningSubmit(event) {
      event.preventDefault();

      const formData = new FormData(event.target);
      const checkedItems = Array.from(formData.getAll('checklist'));
      const guests = getGuestData('opening');
      const reminder = document.getElementById('opening-completion-reminder');

      // Show reminder if not all tasks are completed, but still allow submission
      if (checkedItems.length < 10) {
          reminder.style.display = 'block';
          reminder.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
          // Hide reminder if it was showing
          reminder.style.display = 'none';
      }

      const data = {
          type: 'opening',
          name: formData.get('name'),
          timestamp: formData.get('timestamp'),
          checklist: checkedItems,
          completedTasks: checkedItems.length,
          totalTasks: 11,
          comments: formData.get('comments'),
          guests: guests,
          guestCount: guests.length
      };

      await processSubmission(data, event.target);
  }

  // Handle closing form submission
  async function handleClosingSubmit(event) {
      event.preventDefault();

      const formData = new FormData(event.target);
      const checkedItems = Array.from(formData.getAll('checklist'));
      const guests = getGuestData('closing');
      const reminder = document.getElementById('closing-completion-reminder');

      // Show reminder if not all tasks are completed, but still allow submission
      if (checkedItems.length < 18) {
          reminder.style.display = 'block';
          reminder.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
          // Hide reminder if it was showing
          reminder.style.display = 'none';
      }

      const data = {
          type: 'closing',
          name: formData.get('name'),
          timestamp: formData.get('timestamp'),
          checklist: checkedItems,
          completedTasks: checkedItems.length,
          totalTasks: 19,
          comments: formData.get('comments'),
          guests: guests,
          guestCount: guests.length
      };

      await processSubmission(data, event.target);
  }


  // Process form submission
  async function processSubmission(data, form) {
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;

      // Show loading state
      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing...';

      try {
          // Send to Google Sheets
          await sendToGoogleSheets(data);

          // Send email notification
          await sendEmailNotification(data);

          // Show success message
          showMessage('success', `${data.type.charAt(0).toUpperCase() + data.type.slice(1)} logged successfully!`, form);

          // Reset form
          form.reset();
          setCurrentDateTime();

      } catch (error) {
          console.error('Error processing submission:', error);
          showMessage('error', 'There was an error processing your submission. Please try again.', form);
      } finally {
          // Reset button
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
      }
  }

  // Send data to Google Sheets using form submission method
  async function sendToGoogleSheets(data) {
      try {
          // Create a temporary form for submission
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = CONFIG.GOOGLE_SHEETS_URL;
          form.style.display = 'none';

          // Add data as form fields
          const formData = new FormData();
          formData.append('data', JSON.stringify(data));

          // Convert FormData to form elements
          for (let [key, value] of formData.entries()) {
              const input = document.createElement('input');
              input.type = 'hidden';
              input.name = key;
              input.value = value;
              form.appendChild(input);
          }

          document.body.appendChild(form);

          // Submit the form in a hidden iframe
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.name = 'hidden_iframe';
          document.body.appendChild(iframe);

          form.target = 'hidden_iframe';
          form.submit();

          // Clean up
          setTimeout(() => {
              document.body.removeChild(form);
              document.body.removeChild(iframe);
          }, 1000);

          console.log('Data sent to Google Sheets');
          return Promise.resolve({success: true});
      } catch (error) {
          console.error('Error saving to Google Sheets:', error);
          // Don't throw error - continue with email even if sheets fails
          return Promise.resolve({success: false, error: error.message});
      }
  }

  // Send email notification using EmailJS
  async function sendEmailNotification(data) {
      if (CONFIG.EMAILJS.SERVICE_ID === 'YOUR_EMAILJS_SERVICE_ID') {
          console.log('EmailJS not configured. Email would be sent:', data);
          return Promise.resolve();
      }

      const templateParams = {
          to_email: CONFIG.EMAIL_RECIPIENTS.join(', '),
          subject: `McMillin Cashiers House - ${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Log`,
          name: data.name,
          timestamp: new Date(data.timestamp).toLocaleString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZoneName: 'short'
          }),
          type: data.type,
          completed_tasks: data.completedTasks || 0,
          total_tasks: data.totalTasks || 0,
          checklist: data.checklist ? data.checklist.join('\n• ') : '',
          comments: data.comments || '',
          guest_count: data.guestCount || 0,
          guests: data.guests ? data.guests.map(g => g.name).join('\n• ') : '',
          message: generateEmailBody(data)
      };

      try {
          const response = await emailjs.send(
              CONFIG.EMAILJS.SERVICE_ID,
              CONFIG.EMAILJS.TEMPLATE_ID,
              templateParams
          );
          console.log('Email sent successfully:', response);
          return response;
      } catch (error) {
          console.error('Failed to send email:', error);
          throw new Error('Failed to send email notification');
      }
  }

  // Generate email body
  function generateEmailBody(data) {
      const formattedDateTime = new Date(data.timestamp).toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
      });

      let emailBody = `
  Dear McMillin Family,

  This is an automated notification from the McMillin Cashiers House guest log system.

  ${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Details:
  • Name: ${data.name}
  • Time: ${formattedDateTime}`;

      if (data.type === 'opening' || data.type === 'closing') {
          emailBody += `
  • Tasks Completed: ${data.completedTasks}/${data.totalTasks}
  • Number of Guests: ${data.guestCount}

  Completed Tasks:`;
          data.checklist.forEach(task => {
              emailBody += `\n✓ ${task}`;
          });

          if (data.guests && data.guests.length > 0) {
              emailBody += `\n\nGuests:`;
              data.guests.forEach(guest => {
                  emailBody += `\n• ${guest.name}`;
              });
          }

          if (data.completedTasks < data.totalTasks) {
              emailBody += `\n\nNote: Not all tasks were completed. Please review the checklist.`;
          }
      }

      if (data.comments && data.comments.trim()) {
          emailBody += `

  Comments/Notes:
  ${data.comments}`;
      }

      emailBody += `

  This information has been automatically recorded in the guest log.

  Best regards,
  McMillin Cashiers House Log System`;

      return emailBody.trim();
  }

  // Guest management functions
  function addGuest(type) {
      const guestList = document.getElementById(`${type}GuestList`);
      const newGuest = document.createElement('div');
      newGuest.className = 'guest-entry';
      newGuest.innerHTML = `
          <div class="guest-inputs">
              <input type="text" placeholder="Guest Name" class="guest-name">
              <button type="button" class="remove-guest" onclick="removeGuest(this)">×</button>
          </div>
      `;
      guestList.appendChild(newGuest);
  }

  function removeGuest(button) {
      const guestEntry = button.closest('.guest-entry');
      const guestList = guestEntry.parentNode;

      // Don't remove if it's the last guest entry
      if (guestList.children.length > 1) {
          guestEntry.remove();
      } else {
          // Clear the inputs instead
          const nameInput = guestEntry.querySelector('.guest-name');
          nameInput.value = '';
      }
  }

  function getGuestData(type) {
      const guestList = document.getElementById(`${type}GuestList`);
      const guests = [];

      guestList.querySelectorAll('.guest-entry').forEach(entry => {
          const name = entry.querySelector('.guest-name').value.trim();

          if (name) { // Only add guests with names
              guests.push({
                  name: name
              });
          }
      });

      return guests;
  }

  // Show success/error messages
  function showMessage(type, message, form) {
      // Remove any existing messages
      const existingMessages = form.querySelectorAll('.success-message, .error-message');
      existingMessages.forEach(msg => msg.remove());

      // Create new message element
      const messageDiv = document.createElement('div');
      messageDiv.className = `${type}-message`;
      messageDiv.textContent = message;
      messageDiv.style.display = 'block';

      // Add message to form
      form.appendChild(messageDiv);

      // Auto-hide after 5 seconds
      setTimeout(() => {
          messageDiv.style.display = 'none';
      }, 5000);
  }

  // Setup instructions for Google Sheets integration
  console.log(`
  === SETUP INSTRUCTIONS ===

  To complete the integration, you need to:

  1. GOOGLE SHEETS INTEGRATION:
     - Create a new Google Sheet
     - Go to Extensions > Apps Script
     - Replace the default code with a web app that accepts POST requests
     - Deploy as a web app with public access
     - Copy the web app URL and replace 'YOUR_GOOGLE_SHEETS_WEB_APP_URL_HERE' in CONFIG

  2. EMAIL INTEGRATION:
     - Set up an email service (EmailJS is recommended for client-side)
     - Or create a backend API endpoint for sending emails
     - Replace 'YOUR_EMAIL_SERVICE_URL_HERE' in CONFIG with your service URL

  3. GOOGLE APPS SCRIPT EXAMPLE:
     function doPost(e) {
       const sheet = SpreadsheetApp.getActiveSheet();
       const data = JSON.parse(e.postData.contents);
       
       sheet.appendRow([
         new Date(),
         data.type,
         data.name,
         new Date(data.timestamp)
       ]);
       
       return ContentService
         .createTextOutput(JSON.stringify({success: true}))
         .setMimeType(ContentService.MimeType.JSON);
     }
  `);

