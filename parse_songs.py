#!/usr/bin/env python3
"""Parse Spotify Top 10k songs HTML table to JSON."""

import json
import re
from bs4 import BeautifulSoup

def parse_artist_cell(cell):
    """Parse artist names and IDs from cell."""
    artists = []
    text = str(cell)
    # Split by <br> to get artist entries
    parts = re.split(r'<br\s*/?>', text)

    current_artist = None
    for part in parts:
        part = part.strip()
        if not part:
            continue
        # Check if this is an ID (in span with id-text class)
        id_match = re.search(r'<span class="id-text">([^<]+)</span>', part)
        if id_match:
            if current_artist:
                current_artist['id'] = id_match.group(1)
                artists.append(current_artist)
                current_artist = None
        else:
            # This is an artist name - clean HTML tags
            name = re.sub(r'<[^>]+>', '', part).strip()
            if name:
                current_artist = {'name': name, 'id': None}

    return artists

def parse_track_cell(cell):
    """Parse track name and ID from cell."""
    text = str(cell)
    # Extract ID
    id_match = re.search(r'<span class="id-text">([^<]+)', text)
    track_id = id_match.group(1) if id_match else None

    # Extract name - text before <br>
    name_match = re.search(r'>([^<]+)<br', text)
    if not name_match:
        name_match = re.search(r'>([^<]+)<span', text)
    name = name_match.group(1).strip() if name_match else cell.get_text(strip=True)

    return {'name': name, 'id': track_id}

def parse_album_cell(cell):
    """Parse album name and ID from cell."""
    text = str(cell)
    # Extract ID
    id_match = re.search(r'<span class="id-text">([^<]+)</span>', text)
    album_id = id_match.group(1) if id_match else None

    # Extract name - text before <br>
    name_match = re.search(r'>([^<]+)<br', text)
    if not name_match:
        name_match = re.search(r'>([^<]+)<span', text)
    name = name_match.group(1).strip() if name_match else cell.get_text(strip=True)

    return {'name': name, 'id': album_id}

def main():
    print("Loading HTML file...")
    with open('spotify-top-10k-songs-table.html', 'r', encoding='utf-8') as f:
        html = f.read()

    print("Parsing HTML...")
    soup = BeautifulSoup(html, 'html.parser')

    table = soup.find('table')
    if not table:
        print("No table found!")
        return

    tbody = table.find('tbody')
    rows = tbody.find_all('tr') if tbody else table.find_all('tr')[1:]

    print(f"Found {len(rows)} rows")

    songs = []
    for i, row in enumerate(rows):
        cells = row.find_all('td')
        if len(cells) < 12:
            continue

        try:
            # Parse track info
            track_info = parse_track_cell(cells[1])

            # Parse artists
            artists = parse_artist_cell(cells[2])

            # Parse album
            album_info = parse_album_cell(cells[3])

            song = {
                'rank': int(cells[0].get_text(strip=True)),
                'track': track_info,
                'artists': artists,
                'album': album_info,
                'popularity': int(cells[4].get_text(strip=True)),
                'duration': cells[5].get_text(strip=True),
                'archived': cells[6].get_text(strip=True) == '✔️',
                'explicit': '🅴' in cells[7].get_text(strip=True),
                'release_date': cells[8].get_text(strip=True),
                'album_type': cells[9].get_text(strip=True),
                'isrc': cells[10].get_text(strip=True),
                'copies': int(cells[11].get_text(strip=True)) if cells[11].get_text(strip=True).isdigit() else 1
            }
            songs.append(song)

            if (i + 1) % 1000 == 0:
                print(f"Processed {i + 1} songs...")

        except Exception as e:
            print(f"Error parsing row {i}: {e}")
            continue

    print(f"\nParsed {len(songs)} songs successfully")

    # Save to JSON
    output_file = 'spotify-top-10k-songs.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(songs, f, ensure_ascii=False, indent=2)

    print(f"Saved to {output_file}")

    # Print sample
    print("\nFirst song:")
    print(json.dumps(songs[0], ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
