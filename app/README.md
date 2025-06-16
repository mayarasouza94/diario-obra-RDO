# Construction Daily Report Automation

This is a Flask-based web application developed to replace manual daily reporting (RDO) processes in construction projects. Instead of filling spreadsheets manually, field teams (including contractors and subcontractors) can submit their daily progress directly through a web interface.

Each activity is linked to a specific WBS (EDT) code from the master schedule. This allows automatic, real-time mapping of physical progress and status updates, enabling seamless integration between **field execution** and **planning teams**.

## Key Benefits

- Real-time progress reporting by execution teams
- Activities tracked by WBS code directly from the schedule
- Automatic consolidation of field data for daily reforecasting
- Seamless integration between planning and production departments
- Web-based interface accessible by field teams and planners
- Export daily records to XLSX for audit and documentation

## Tech Stack

- Flask (Python)
- HTML/CSS/JavaScript (Jinja2 templates)
- Excel reading/writing with `openpyxl`

## How to Run

1. Clone the repo  
2. Create a `.env` file based on `.env.example`
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the app:
   ```bash
   python app/app.py
   ```

## Folder Structure

- `app/`: Flask application logic  
- `templates/`: HTML templates  
- `static/`: JS, CSS, and other assets  
- `examples/`: Sample Excel schedule file (anonymized)

## License

This project is shared for **portfolio and demonstration purposes only**.  
Commercial use, reproduction, or redistribution without permission is prohibited.
