# Tungsten UI

A modern Django component library built with Django Cotton, Tailwind CSS, and DaisyUI.

## 🚀 Quick Installation

### For End Users (Recommended)

#### 1. Install Package

```bash
pip install tungsten-ui
```

This automatically installs Django Cotton as a dependency.

#### 2. Configure Django Settings

Add to your `settings.py`:

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party apps
    'django_cotton',           # Required: Django Cotton
    'tungsten_ui',    # Tungsten UI
    
    # Your apps
    'your_app',
]
```

#### 3. Include Required Assets

**Simple Method (Recommended):**
```html
<!-- In your base.html head section -->
{% include "init-components.html" %}
```

**Manual Method (Optional):**
```html
<!-- In your base.html -->
<head>
    {% load static %}
    
    <!-- Tungsten UI CSS (pre-built) -->
    <link rel="stylesheet" href="{% static 'tungsten_ui/css/components.css' %}">
    
    <!-- HTMX -->
    <script src="https://cdn.jsdelivr.net/npm/htmx.org@2.0.6/dist/htmx.min.js"></script>
    
    <!-- Alpine.js (for reactive components) -->
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.8/dist/cdn.min.js"></script>
    
    <!-- Tungsten UI JavaScript -->
    <script src="{% static 'tungsten_ui/js/components.js' %}"></script>
</head>
```

#### 4. Start Using Components

```html
<!-- Button component -->
<c-button variant="primary" size="lg">
    Click me!
</c-button>

<!-- Card component -->
<c-card class="max-w-sm">
    <c-slot name="title">Card Title</c-slot>
    <c-slot name="content">
        <p>This is a card content.</p>
    </c-slot>
</c-card>

<!-- Table with filters -->
<c-table :data="employees">
    <c-table.column field="name" label="Name" />
    <c-table.column field="department" label="Department" filterable />
    <c-table.column field="salary" label="Salary" filterable format="currency" />
</c-table>
```


## 📄 License

MIT License

---

**Tungsten UI - Built with Django, Cotton, Tailwind CSS, DaisyUI, HTMX, and Alpine.js**