import os

base_dir = r"e:\Huergo\Huergo. 5° Año\Plan-De-Viajes\Proyecto"
html_dir = os.path.join(base_dir, "html's")
files_to_update = [
    os.path.join(base_dir, "index.html"),
]

for f in os.listdir(html_dir):
    if f.endswith('.html'):
        files_to_update.append(os.path.join(html_dir, f))

for file_path in files_to_update:
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace the link
        if 'index.html' in file_path:
            content = content.replace('<a class="nav-link" href="#">Precio</a>', '<a class="nav-link" href="html\'s/prices.html">Precio</a>')
        else:
            content = content.replace('<a class="nav-link" href="#">Precio</a>', '<a class="nav-link" href="prices.html">Precio</a>')
            
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated {file_path}')
    except Exception as e:
        print(f'Error updating {file_path}: {e}')
