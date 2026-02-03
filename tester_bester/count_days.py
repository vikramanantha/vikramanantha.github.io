from datetime import datetime, timedelta

# Define today's date
today = datetime.now().date()

# Define the target date
target_date = datetime(2026, 4, 30).date()

# Define dates to skip (add dates in YYYY, M, D format)
skip_dates = {
    'Jan 17', 
    'Jan 18',
    'Jan 22 - Jan 26',
    'Feb 28 - Mar 8'
    
}

# Parse skip_dates to handle both individual dates and date ranges
def should_skip(current_date, skip_dates):
    date_str = current_date.strftime('%b %d').replace(' 0', ' ')
    
    for skip_entry in skip_dates:
        if ' - ' in skip_entry:
            # Handle date range
            start_str, end_str = skip_entry.split(' - ')
            # Parse dates with current year
            start_date = datetime.strptime(f"{start_str} {current_date.year}", '%b %d %Y').date()
            end_date = datetime.strptime(f"{end_str} {current_date.year}", '%b %d %Y').date()
            if start_date <= current_date <= end_date:
                return True
        else:
            # Handle individual date
            if date_str == skip_entry:
                return True
    return False

# Count days from today to target date (inclusive)
current_date = today
day_count = 0
skip_count = 0
while current_date <= target_date:
    if not should_skip(current_date, skip_dates):
        day_count += 1
    else:
        skip_count += 1
    current_date += timedelta(days=1)

print(f"Number of days from {today} to {target_date} (inclusive): \n{day_count} ({day_count * 2} meals)")

print(f"Skipped {skip_count} date(s)")
