import google.generativeai as genai
import os
import time

# 1. Configuración
# Asegúrate de tener la variable de entorno configurada o reemplaza aquí
api_key = os.getenv("GEMINI_API_KEY") 
if not api_key:
    print("⚠️  GEMINI_API_KEY no encontrada en variables de entorno.")
    # api_key = "TU_API_KEY_AQUI" # Descomentar para pruebas rápidas
else:
    genai.configure(api_key=api_key)

def sync_manuals(folder_path="./manuals"):
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)
        print(f"📁 Carpeta creada: {folder_path}. Por favor coloca los PDFs ahí.")
        return []

    uploaded_files = []
    
    print("🚀 Iniciando carga de manuales ATSEP...")
    
    for file_name in os.listdir(folder_path):
        if file_name.lower().endswith(".pdf"):
            full_path = os.path.join(folder_path, file_name)
            
            # Subir el archivo a la infraestructura de Google
            print(f"📤 Subiendo: {file_name}...")
            try:
                file = genai.upload_file(path=full_path, display_name=file_name)
                
                # Esperar a que el archivo sea procesado por la IA
                print("⏳ Procesando", end="")
                while file.state.name == "PROCESSING":
                    print(".", end="", flush=True)
                    time.sleep(2)
                    file = genai.get_file(file.name)
                
                if file.state.name == "FAILED":
                     print(f"\n❌ Error procesando {file_name}")
                else:
                    uploaded_files.append(file)
                    print(f"\n✅ {file_name} listo. URI: {file.uri}")
            except Exception as e:
                print(f"\n❌ Error subiendo {file_name}: {e}")

    return uploaded_files

if __name__ == "__main__":
    # Script independiente para probar la carga
    manuals = sync_manuals()
    
    if manuals:
        print(f"\n📚 {len(manuals)} manuales cargados al contexto de Gemini.")
        
        # Ejemplo de Chat
        model = genai.GenerativeModel(
            model_name="gemini-1.5-pro",
            system_instruction="Sos el asistente técnico experto del sistema Antygravity para EANA. Respondé consultas basándote exclusivamente en los manuales técnicos adjuntos."
        )

        chat = model.start_chat(history=[
            {
                "role": "user",
                "parts": ["Hola, confirmo recepción de manuales.", *manuals]
            }
        ])

        print("\n💬 Iniciando prueba de chat...")
        response = chat.send_message("¿Qué temas cubren estos manuales?")
        print(f"\n🤖 IA: {response.text}")
    else:
        print("\n⚠️  No se cargaron manuales. Verifica la carpeta ./manuals")
