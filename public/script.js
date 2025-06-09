document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('uploadForm');
    const fileInput = document.getElementById('pdfFile');
    const uploadSection = document.getElementById('uploadSection');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const passwordSection = document.getElementById('passwordSection');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    const passwordError = document.getElementById('passwordError');
    const passwordLengthError = document.getElementById('passwordLengthError');
    const submitBtn = document.getElementById('submitBtn');
    const toast = document.getElementById('toast');

    // Hide error messages initially
    passwordError.style.display = 'none';
    passwordLengthError.style.display = 'none';

    // File input change handler
    fileInput.addEventListener('change', function(e) {
        const file = this.files[0];
        if (file) {
            if (file.type === 'application/pdf') {
                showFileInfo(file);
                passwordSection.style.display = 'block';
                validateForm();
            } else {
                alert('Please upload a PDF file');
                resetForm();
            }
        }
    });

    // Drag and drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadSection.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadSection.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadSection.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        uploadSection.classList.add('dragover');
    }

    function unhighlight(e) {
        uploadSection.classList.remove('dragover');
    }

    uploadSection.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        
        if (file) {
            fileInput.files = dt.files;
            if (file.type === 'application/pdf') {
                showFileInfo(file);
                passwordSection.style.display = 'block';
                validateForm();
            } else {
                alert('Please upload a PDF file');
                resetForm();
            }
        }
    }

    function showFileInfo(file) {
        fileName.textContent = file.name;
        fileInfo.style.display = 'block';
    }

    // Password validation
    password.addEventListener('input', validateForm);
    confirmPassword.addEventListener('input', validateForm);

    function validateForm() {
        let isValid = true;

        // Reset error states
        password.classList.remove('error');
        confirmPassword.classList.remove('error');
        passwordError.style.display = 'none';
        
        // Check if file is selected
        if (!fileInput.files.length) {
            isValid = false;
        }

        // Only show password length error if user has started typing and it's too short
        if (password.value.length > 0 && password.value.length < 6) {
            password.classList.add('error');
            passwordLengthError.style.display = 'block';
            isValid = false;
        } else {
            passwordLengthError.style.display = 'none';
        }

        // Only show password match error if both fields have content
        if (password.value && confirmPassword.value && password.value !== confirmPassword.value) {
            password.classList.add('error');
            confirmPassword.classList.add('error');
            passwordError.style.display = 'block';
            isValid = false;
        }

        // Enable/disable submit button
        submitBtn.disabled = !isValid;
        
        return isValid;
    }

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (validateForm()) {
            const formData = new FormData();
            formData.append('pdf', fileInput.files[0]);
            formData.append('password', password.value);

            submitBtn.disabled = true;
            
            fetch('/encrypt', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) throw new Error('Encryption failed');
                return response.blob();
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'encrypted.pdf';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                showToast();
                resetForm();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while encrypting the PDF');
            })
            .finally(() => {
                submitBtn.disabled = false;
            });
        }
    });

    // Show toast message
    function showToast() {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Reset form
    window.resetForm = function() {
        form.reset();
        fileInfo.style.display = 'none';
        passwordSection.style.display = 'none';
        passwordError.style.display = 'none';
        passwordLengthError.style.display = 'none';
        password.classList.remove('error');
        confirmPassword.classList.remove('error');
        submitBtn.disabled = true;
    }
}); 