# LokalBank End-to-End Manual Regression Checklist

| Scenario | Steps to Execute | Expected Result | Verified |
|---|---|---|---|
| **1. Guest Access** | Open app as non-authenticated guest and click "Add Resource" | Sign-In modal appears; no upload or mutation request sent. | [ ] |
| **2. Seeded Teacher Sign-In** | Enter `teacher@lokalswap.edu` / `password123` | Session establishes; Add Resource modal opens. | [ ] |
| **3. Blank Manual Selection** | Open Add Resource modal | Title is empty; Type, Subject, and Grade are unselected placeholders (`Select a...`). | [ ] |
| **4. Oversized File Upload** | Pick a file > 5 MB | File picker displays immediate validation error: `File exceeds the 5 MB limit.` | [ ] |
| **5. Unsupported File** | Pick a `.exe` or `.png` file | File picker displays immediate validation error: `Only PDF, DOCX, or TXT files are accepted.` | [ ] |
| **6. Successful File Extraction & Save** | Select valid TXT/DOCX/PDF, fill manual metadata, click Publish | Button shows `Extracting file…` then `Publishing resource…`; new row appears in table. | [ ] |
| **7. Positive Review Analysis** | Click "Generate suggestion" on a 5-star praise review | Groq output displays `outcome: "no_change"` card with reason; **no Accept edit button**. | [ ] |
| **8. Actionable Issue Analysis** | Click "Generate suggestion" on a review requesting a specific change | Groq output displays target excerpt, replacement text, and **Accept edit** button. | [ ] |
| **9. Accept Actionable Edit** | Click "Accept edit" on an actionable suggestion | Preview updates immediately, database updates `content_text` and `updated_at`, status becomes accepted. | [ ] |
| **10. Export PDF & TXT** | Click Download PDF and Download TXT | PDF and TXT downloads contain the latest updated resource text. | [ ] |
