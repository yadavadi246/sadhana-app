import os
from PIL import Image, ImageDraw, ImageFont

def generate_sadhana_png():
    # Dimensions: 800 x 1050 pixels (perfect for standard high-res card printing)
    width = 800
    height = 1050
    
    # Color scheme (Vedic theme matches HTML/CSS)
    color_bg = (252, 248, 242)       # Parchment
    color_ink = (47, 35, 23)         # Deep Ink
    color_ink_soft = (124, 105, 85)  # Soft Ink
    color_gold = (197, 153, 59)      # Gold
    color_saffron = (211, 110, 42)   # Saffron
    color_line = (235, 222, 208)     # Soft Line
    
    image = Image.new('RGB', (width, height), color_bg)
    draw = ImageDraw.Draw(image)
    
    # 1. Double Borders
    draw.rectangle([10, 10, width - 10, height - 10], outline=color_saffron, width=2)
    draw.rectangle([15, 15, width - 15, height - 15], outline=color_gold, width=1)
    
    # 2. Fonts Loading (Windows defaults)
    try:
        font_title = ImageFont.truetype("C:\\Windows\\Fonts\\georgiab.ttf", 26)
        font_subtitle = ImageFont.truetype("C:\\Windows\\Fonts\\georgiai.ttf", 14)
        font_header_sub = ImageFont.truetype("C:\\Windows\\Fonts\\georgiab.ttf", 10)
        font_bold = ImageFont.truetype("C:\\Windows\\Fonts\\arialbd.ttf", 11)
        font_regular = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", 11)
        font_small = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", 9.5)
        font_sloka_trans = ImageFont.truetype("C:\\Windows\\Fonts\\georgiai.ttf", 12)
        font_sloka_eng = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", 10.5)
    except IOError:
        # Fallback to default load if specific fonts aren't available
        font_title = font_subtitle = font_header_sub = font_bold = font_regular = font_small = font_sloka_trans = font_sloka_eng = ImageFont.load_default()

    # 3. Header Texts (OM ornament removed)
    mantra = "HARE KRISHNA HARE KRISHNA KRISHNA KRISHNA HARE HARE / HARE RAMA HARE RAMA RAMA RAMA HARE HARE"
    draw.text((width / 2, 50), mantra, fill=color_saffron, font=font_header_sub, anchor="mm")
    
    draw.text((width / 2, 80), "Sadhana Card", fill=color_ink, font=font_title, anchor="mm")
    draw.text((width / 2, 108), "harer nama eva kevalam", fill=color_ink, font=font_subtitle, anchor="mm")
    
    # 5. Metadata Lines
    draw.text((45, 160), "Sadhaka Name: __________________________________", fill=color_ink, font=font_bold)
    draw.text((width - 45, 160), "Week Of: ______________________", fill=color_ink, font=font_bold, anchor="ra")
    
    # 6. Table Layout Coordinates
    table_x = 45
    table_y = 190
    table_w = width - 90
    
    # Table column widths: Activity (220px), Mon-Sun (7 columns * 70px each = 490px). Total = 710px.
    col_widths = [220, 70, 70, 70, 70, 70, 70, 70]
    col_x = [table_x]
    for w in col_widths[:-1]:
        col_x.append(col_x[-1] + w)
    
    row_height = 34
    
    # Define Rows structure (grouped by section)
    # Section format: (Type, Label/Sublabel)
    # Type: 'H' (Header Row), 'D' (Data Row)
    rows_data = [
        ('H', "BEFORE DAWN"),
        ('D', "Wake-up Time", "Rising for sadhana"),
        ('D', "Morning Chanting", "Japa rounds before noon"),
        ('H', "MORNING"),
        ('D', "Mangala Aarti", "Attended? (yes/no)"),
        ('D', "Morning Class", "Attended class? (yes/no)"),
        ('D', "Additional Chanting", "Other rounds chanted"),
        ('H', "COLLEGE CLASSES"),
        ('D', "College Time", ""),
        ('H', "SELF-STUDY"),
        ('D', "Study Time", ""),
        ('H', "DAY & NIGHT"),
        ('D', "Day Sleep", "Rest time (minutes)"),
        ('D', "Bedtime", "Time to sleep (PM/AM)")
    ]
    
    # Draw Table Header
    headers = ["Spiritual Discipline", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    header_h = 32
    
    # Draw Header Box background
    draw.rectangle([table_x, table_y, table_x + table_w, table_y + header_h], fill=(245, 235, 222), outline=color_saffron, width=1)
    
    # Draw Table Header Text
    for idx, text in enumerate(headers):
        if idx == 0:
            draw.text((col_x[idx] + 12, table_y + header_h / 2), text, fill=color_ink, font=font_bold, anchor="lm")
        else:
            draw.text((col_x[idx] + col_widths[idx] / 2, table_y + header_h / 2), text, fill=color_ink, font=font_bold, anchor="mm")
            
    # Vertical grid line pointers
    curr_y = table_y + header_h
    
    for row in rows_data:
        r_type = row[0]
        if r_type == 'H':
            # Section Header Row
            draw.rectangle([table_x, curr_y, table_x + table_w, curr_y + 24], fill=(245, 235, 222), outline=color_saffron, width=1)
            draw.text((table_x + 12, curr_y + 12), row[1], fill=color_saffron, font=font_bold, anchor="lm")
            curr_y += 24
        else:
            # Data Row
            draw.rectangle([table_x, curr_y, table_x + table_w, curr_y + row_height], outline=color_line, width=1)
            # Saffron left accent line for the label cell
            draw.line([table_x, curr_y, table_x, curr_y + row_height], fill=color_saffron, width=3)
            
            # Print Labels
            label_y = curr_y + (10 if row[2] else row_height / 2)
            draw.text((table_x + 12, label_y), row[1], fill=color_ink, font=font_bold, anchor="lm")
            if row[2]:
                draw.text((table_x + 12, curr_y + 22), row[2], fill=color_ink_soft, font=font_small, anchor="lm")
                
            curr_y += row_height
            
    # Draw Vertical Grid Lines across the entire table body (excluding headers)
    total_table_height = curr_y - table_y
    for idx in range(1, len(col_x)):
        # Draw columns line
        draw.line([col_x[idx], table_y, col_x[idx], curr_y], fill=color_line, width=1)
        
    # Redraw outer table border in saffron
    draw.rectangle([table_x, table_y, table_x + table_w, curr_y], outline=color_saffron, width=1)
    
    # 7. Shloka Container Box
    sloka_y = curr_y + 26
    sloka_h = 100
    
    draw.rectangle([table_x, sloka_y, table_x + table_w, sloka_y + sloka_h], fill=(250, 242, 232), outline=color_gold, width=1)
    # Left/Right gold accent bars
    draw.line([table_x, sloka_y, table_x, sloka_y + sloka_h], fill=color_gold, width=4)
    draw.line([table_x + table_w, sloka_y, table_x + table_w, sloka_y + sloka_h], fill=color_gold, width=4)
    
    # Shloka Texts (Transliterated only in image to guarantee zero square boxes)
    trans_text_1 = "shraddhavan labhate jnanam tat-parah samyatendriyah"
    trans_text_2 = "jnanam labdha param shantim acirenadhigacchati"
    eng_text_1 = '"A faithful man who is dedicated to knowledge, and who subdues his senses, achieves'
    eng_text_2 = 'this knowledge, and having achieved it, he quickly attains supreme spiritual peace."'
    eng_source = "- Bhagavad Gita 4.39"
    
    draw.text((width / 2, sloka_y + 18), trans_text_1, fill=color_saffron, font=font_sloka_trans, anchor="mm")
    draw.text((width / 2, sloka_y + 34), trans_text_2, fill=color_saffron, font=font_sloka_trans, anchor="mm")
    draw.text((width / 2, sloka_y + 56), eng_text_1, fill=color_ink_soft, font=font_sloka_eng, anchor="mm")
    draw.text((width / 2, sloka_y + 70), eng_text_2, fill=color_ink_soft, font=font_sloka_eng, anchor="mm")
    draw.text((width / 2, sloka_y + 84), eng_source, fill=color_ink_soft, font=font_small, anchor="mm")
    
    # 8. Footer Slogan
    draw.text((width / 2, height - 42), "* krisnas tu bhagavan svayam *", fill=color_saffron, font=font_subtitle, anchor="mm")
    
    # 9. Save Image
    output_path = os.path.join("C:\\Users\\user\\.gemini\\antigravity\\scratch\\sadhana-app", "sadhana_card.png")
    image.save(output_path, "PNG", dpi=(300, 300))
    print(f"PNG Card saved successfully at: {output_path}")

if __name__ == "__main__":
    generate_sadhana_png()
