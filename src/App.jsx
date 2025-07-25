import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Music, Volume2, VolumeX, Plus, X, Search, LogOut, ArrowLeft } from 'lucide-react'; // Added ArrowLeft icon

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, push, onValue, remove, get, update } from 'firebase/database';

// Global variables provided by the Canvas environment (initialAuthToken is no longer used for anonymous login)
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Firebase configuration provided by the user
const firebaseConfig = {
  apiKey: "AIzaSyDlT5sCVMBZSWqYTu9hhstp4Fr7N66SWss",
  authDomain: "faceattendancerealtime-fbdf2.firebaseapp.com",
  databaseURL: "https://faceattendancerealtime-fbdf2-default-rtdb.firebaseio.com",
  projectId: "faceattendancerealtime-fbdf2",
  storageBucket: "faceattendancerealtime-fbdf2.appspot.com",
  messagingSenderId: "338410759674",
  appId: "1:338410759674:web:51fc5d6846c979ef8a3043",
  measurementId: "G-Z1M0VF25TP"
};

// Use the appId from the provided firebaseConfig
const appId = firebaseConfig.appId;

// Base URL for your Supabase storage or local public folder for songs
const supabaseBase = "https://khaoplokzfvxueaqgixx.supabase.co/storage/v1/object/public/data/";

// Array of video sources for background (place your videos in public/videos/)
const defaultVideoSources = [
  "/videos/bam.mp4", // Example: Replace with your video paths
  "/videos/diden.mp4",
  "/videos/okay.mp4",
  "/videos/reto.mp4",
  "/videos/tv.mp4",
  // Add more video paths as needed
];

// Initial placeholder songs (these are the "master" list of available songs)
const defaultAvailableSongsRaw = [
   { id: 'placeholder-1', title: 'Hold Me Down', artist: 'Daniel Caesar', filename: 'Hold Me Down.mp3' },
  { id: 'placeholder-2', title: 'Nikes', artist: 'Frank Ocean', filename: 'Nikes.mp3' },
  { id: 'placeholder-3', title: 'Ivy', artist: 'Frank Ocean', filename: 'Ivy.mp3' },
  { id: 'placeholder-4', title: 'Pink + White', artist: 'Frank Ocean', filename: 'pinkandwhite.mp3' },
  { id: 'placeholder-5', title: 'Be Yourself', artist: 'Frank Ocean', filename: 'Be Yourself.mp3' },
  { id: 'placeholder-6', title: 'Solo', artist: 'Frank Ocean', filename: 'Solo.mp3' },
  { id: 'placeholder-7', title: 'Skyline To', artist: 'Frank Ocean', filename: 'Skyline To.mp3' },
  { id: 'placeholder-8', title: 'Self Control', artist: 'Frank Ocean', filename: 'Self Control.mp3' },
  { id: 'placeholder-9', title: 'Good Guy', artist: 'Frank Ocean', filename: 'Good Guy.mp3' },
  { id: 'placeholder-10', title: 'Nights', artist: 'Frank Ocean', filename: 'Nights.mp3' },
  { id: 'placeholder-11', title: 'Solo (Reprise)', artist: 'Frank Ocean', filename: 'Solo (Reprise).mp3' },
  { id: 'placeholder-12', title: 'Pretty Sweet', artist: 'Frank Ocean', filename: 'Pretty Sweet.mp3' },
  { id: 'placeholder-13', title: 'Facebook Story', artist: 'Frank Ocean', filename: 'Facebook Story.mp3' },
  { id: 'placeholder-14', title: 'Close To You', artist: 'Frank Ocean', filename: 'Close To You.mp3' },
  { id: 'placeholder-15', title: 'White Ferrari', artist: 'Frank Ocean', filename: 'White Ferrari.mp3' },
  { id: 'placeholder-16', title: 'Seigfried', artist: 'Frank Ocean', filename: 'Seigfried.mp3' },
  { id: 'placeholder-17', title: 'Godspeed', artist: 'Frank Ocean', filename: 'Godspeed.mp3' },
  { id: 'placeholder-18', title: 'Futura Free', artist: 'Frank Ocean', filename: 'Futura Free.mp3' },
  { id: 'placeholder-19', title: 'Multo', artist: 'Cup of Joe', filename: 'Multo - Cup of Joe.mp3' },
  { id: 'placeholder-20', title: 'back to friends', artist: 'sombr', filename: 'sombr - back to friends.mp3' },
  { id: 'placeholder-21', title: 'You and Me', artist: 'Lifehouse', filename: 'You and Me - Lifehouse.mp3' },
  { id: 'placeholder-22', title: 'Clairvoyant', artist: 'The Story So Far', filename: 'The Story So Far - Chairvoyant.mp3' },
  { id: 'placeholder-23', title: 'La La Lost You', artist: 'NIKI', filename: 'NIKI- La La Lost You.mp3' },
  { id: 'placeholder-24', title: 'Toronto 2014', artist: 'Daniel Caesar', filename: 'Daniel Caesar - Toronto 2014.mp3' },
  { id: 'placeholder-25', title: 'Tibok', artist: 'Earl Agustin', filename: 'Tibok - Earl Agustin.mp3' },
  { id: 'placeholder-26', title: "The Man Who Can't Be Moved", artist: 'The Script', filename: "The Script - The Man Who Can't Be Moved.mp3" },
  { id: 'placeholder-27', title: 'I Like U', artist: 'Niki', filename: 'Niki- I Like U.mp3' },
  { id: 'placeholder-28', title: 'Burnout', artist: 'Sugarfree', filename: 'Sugarfree - Burnout.mp3' },
  { id: 'placeholder-29', title: 'DTfM', artist: 'Bad Bunny', filename: 'Bad Bunny - DtMF.mp3' },
  { id: 'placeholder-30', title: 'Ribs', artist: 'Lorde', filename: 'Ribs - Lorde.mp3' },
  { id: 'placeholder-31', title: 'Love Affair', artist: 'UMI', filename: 'UMI - Love Affair.mp3' },
  { id: 'placeholder-32', title: 'Dantay', artist: 'Kiyo', filename: 'kiyo - Dantay.mp3' },
  { id: 'placeholder-33', title: "You'll Be in My Heart", artist: 'NIKI', filename: "NIKI - You'll be in my heart.mp3" },
  { id: 'placeholder-34', title: 'Iris', artist: 'Goo Goo Dolls', filename: 'Goo Goo Dolls - Iris.mp3' },
  { id: 'placeholder-35', title: 'Ikaw Lang', artist: 'Kiyo', filename: 'Kiyo - Ikaw Lang.mp3' },
  { id: 'placeholder-36', title: 'Backburner', artist: 'NIKI', filename: 'NIKI -  Backburner.mp3' },
  { id: 'placeholder-37', title: 'ILYSB', artist: 'LANY', filename: 'LANY - ILYSB.mp3' },
  { id: 'placeholder-38', title: "I'll Be", artist: 'Edwin McCain', filename: "Edwin McCain - I'll Be.mp3" },
  { id: 'placeholder-39', title: 'Your Universe', artist: 'Rico Blanco', filename: 'Rico Blanco - Your Universe.mp3' },
  { id: 'placeholder-40', title: 'All We Know', artist: 'The Chainsmokers', filename: 'The Chainsmokers - All We Know.mp3' },
  { id: 'placeholder-41', title: 'PARTY 4 U', artist: 'Charli XCX', filename: 'Charli XCX - PARTY 4 U.mp3' },
  { id: 'placeholder-42', title: 'Dalangin', artist: 'Earl Agustin', filename: 'Dalangin - Earl Agustin.mp3' },
  { id: 'placeholder-43', title: 'Tingin', artist: 'Cup of Joe, Janine', filename: 'Cup of Joe, Janine - Tingin.mp3' },
  { id: 'placeholder-44', title: 'DAISIES', artist: 'Justin Bieber', filename: 'Justin Bieber - DAISIES.mp3' },
  { id: 'placeholder-45', title: 'David', artist: 'Lorde', filename: 'Lorde - David.mp3' },
  { id: 'placeholder-46', title: 'JUMP', artist: 'BLACKPINK', filename: 'BLACKPINK - JUMP.mp3' },
  { id: 'placeholder-47', title: 'Gameboy', artist: 'KATSEYE', filename: 'KATSEYE - Gameboy.mp3' },
  { id: 'placeholder-48', title: 'Go Baby', artist: 'Justin Bieber', filename: 'Justin Bieber - Go Baby.mp3' },
  { id: 'placeholder-49', title: 'Current Affairs', artist: 'Lorde', filename: 'Lorde - Current Affairs.mp3' },
  { id: 'placeholder-50', title: 'Nasty', artist: 'Tinashe', filename: 'Tinashe - Nasty.mp3' },
  { id: 'placeholder-51', title: 'Kingston', artist: 'Faye Webster', filename: 'Faye Webster - Kingston.mp3' },
  { id: 'placeholder-52', title: 'About You', artist: 'The 1975', filename: 'The 1975 - About You.mp3' },
  { id: 'placeholder-53', title: 'Mean Girls', artist: 'KATSEYE', filename: 'KATSEYE - Mean Girls.mp3' },
  { id: 'placeholder-54', title: 'DEVOTION', artist: 'Justin Bieber', filename: 'Justin Bieber - DEVOTION.mp3' },
  { id: 'placeholder-55', title: 'The Field', artist: 'Blood Orange', filename: 'Blood Orange - The Field.mp3' },
  { id: 'placeholder-56', title: 'Bags', artist: 'Clairo', filename: 'Clairo - Bags.mp3' },
  { id: 'placeholder-57', title: 'THIS IS FOR', artist: 'Twice', filename: 'Twice - THIS IS FOR.mp3' },
  { id: 'placeholder-58', title: 'Folded', artist: 'Kehlani', filename: 'Kehlani - Folded.mp3' },
  { id: 'placeholder-59', title: 'WALKING AWAY', artist: 'Justin Bieber', filename: 'Justin Bieber - WALKING AWAY.mp3' },
  { id: 'placeholder-60', title: 'Shapeshifter', artist: 'Lorde', filename: 'Lorde - Shapeshifter.mp3' },
  { id: 'placeholder-61', title: 'Motion Sickness', artist: 'Phoebe Bridgers', filename: 'Phoebe Bridgers - Motion Sickness.mp3' },
  { id: 'placeholder-62', title: 'No One Noticed', artist: 'The Marías', filename: 'The Marías - No One Noticed.mp3' },
  { id: 'placeholder-63', title: 'Motion Sickness', artist: 'Phoebe Bridgers', filename: 'Motion Sickness - Phoebe Bridgers.mp3' },
  { id: 'placeholder-64', title: 'luther', artist: 'Kendrick Lamar', filename: 'Kendrick Lamar - luther.mp3' },
  { id: 'placeholder-65', title: 'Kiss It Better', artist: 'Rihanna', filename: 'Rihanna - Kiss It Better.mp3' },
  { id: 'placeholder-66', title: 'BIRDS OF A FEATHER', artist: 'Billie Eilish', filename: 'Billie Eilish - BIRDS OF A FEATHER.mp3' },
  { id: 'placeholder-67', title: 'All The Stars', artist: 'Kendrick Lamar, SZA', filename: 'Kendrick Lamar, SZA - All The Stars.mp3' },
  { id: 'placeholder-68', title: 'Sofia', artist: 'Clairo', filename: 'Clairo - Sofia.mp3' },
  { id: 'placeholder-69', title: 'SEE YOU AGAIN', artist: 'Tyler, The Creator', filename: 'Tyler, The Creator - SEE YOU AGAIN.mp3' },
  { id: 'placeholder-70', title: 'Bed Chem', artist: 'Sabrina Carpenter', filename: 'Sabrina Carpenter - Bed Chem.mp3' },
  { id: 'placeholder-71', title: 'supernatural', artist: 'Ariana Grande', filename: 'Ariana Grande - supernatural.mp3' },
  { id: 'placeholder-72', title: 'Moment Of Truth', artist: 'Fm Static', filename: 'Fm Static - Moment Of Truth.mp3' },
  { id: 'placeholder-73', title: 'Creep', artist: 'Radiohead', filename: 'Radiohead - Creep.mp3' },
  { id: 'placeholder-74', title: 'All My Friends', artist: 'Snakehips', filename: 'Snakehips - All My Friends.mp3' },
  { id: 'placeholder-75', title: 'Same Ground', artist: 'Kitchie Nadal', filename: 'Kitchie Nadal - Same Ground.mp3' },
  { id: 'placeholder-76', title: 'No Surprises', artist: 'Radiohead', filename: 'Radiohead - No Surprises.mp3' },
  { id: 'placeholder-77', title: 'Breakeven', artist: 'The Script', filename: 'The Script - Breakeven.mp3' },
  { id: 'placeholder-78', title: 'All I Ever Need', artist: 'Austin Mahone', filename: 'Austin Mahone - All I Ever Need.mp3' },
  { id: 'placeholder-79', title: 'PILLOWTALK', artist: 'ZAYN', filename: 'ZAYN - Pillowtalk.mp3' },
  { id: 'placeholder-80', title: 'Coffee', artist: 'Beabadoobee', filename: 'Beabadoobee - Coffee.mp3' },
  { id: 'placeholder-81', title: 'Middle', artist: 'DJ Snake ft. Bipolar Sunshine', filename: 'DJ Snake ft. Bipolar Sunshine - Middle.mp3' },
  { id: 'placeholder-82', title: 'The Scientist', artist: 'Coldplay', filename: 'Coldplay - The Scientist.mp3' },
  { id: 'placeholder-83', title: 'Almost Is Never Enough', artist: 'Ariana Grande', filename: 'Ariana Grande - Almost Is Never Enough.mp3' },
  { id: 'placeholder-84', title: 'Roses', artist: 'The Chainsmokers', filename: 'The Chainsmokers - Roses.mp3' },
  { id: 'placeholder-85', title: 'All We Know', artist: 'The Chainsmokers', filename: 'All We Know.mp3' },
  { id: 'placeholder-86', title: 'Closer', artist: 'The Chainsmokers ft. Halsey', filename: 'The Chainsmokers - Closer ft. Halsey.mp3' },
  { id: 'placeholder-87', title: 'Statue', artist: 'Lil Eddie', filename: 'Lil Eddie - Statue.mp3' },
  { id: 'placeholder-88', title: 'death bed', artist: 'Powfu ft. Beabadoobee', filename: 'Powfu - death bed ft. beabadoobee.mp3' },
  { id: 'placeholder-89', title: "We Can't Stop", artist: 'Miley Cyrus', filename: "Miley Cyrus - We Can't Stop.mp3" },
  { id: 'placeholder-90', title: 'Cold Water', artist: 'Major Lazer', filename: 'Major Lazer - Cold Water.mp3' },
  { id: 'placeholder-91', title: 'not a lot, just forever', artist: 'Adrianne Lenker', filename: 'Adrianne Lenker - not a lot, just forever.mp3' },
  { id: 'placeholder-92', title: 'If I Were a Boy', artist: 'Beyonce', filename: 'Beyonce - If I Were a Boy.mp3' },
  { id: 'placeholder-93', title: 'Really', artist: 'BLACKPINK', filename: 'BLACKPINK - Really.mp3' },
  { id: 'placeholder-94', title: 'Pyramid', artist: 'Charice', filename: 'Charice - Pyramid.mp3' },
  { id: 'placeholder-95', title: 'Bubbly', artist: 'Colbie Caillat', filename: 'Colbie Caillat - Bubbly.mp3' },
  { id: 'placeholder-96', title: 'Tonight', artist: 'FM Static', filename: 'FM Static - Tonight.mp3' },
  { id: 'placeholder-97', title: 'La Vie en Rose', artist: 'IZ ONE', filename: 'IZ ONE - La Vie en Rose.mp3' },
  { id: 'placeholder-98', title: 'Home', artist: 'Janet Suhh', filename: 'Janet Suhh - Home.mp3' },
  { id: 'placeholder-99', title: 'Damn Right', artist: 'Jennie', filename: 'Jennie - Damn Right.mp3' },
  { id: 'placeholder-100', title: 'Handlebars', artist: 'JENNIE', filename: 'JENNIE - Handlebars.mp3' },
  { id: 'placeholder-101', title: 'Byahe', artist: 'John Roa', filename: 'John Roa - Byahe.mp3' },
  { id: 'placeholder-102', title: 'Down To Earth', artist: 'Justin Bieber', filename: 'Justin Bieber - Down To Earth.mp3' },
  { id: 'placeholder-103', title: 'Ghost Town', artist: 'Kanye West', filename: 'Kanye West - Ghost Town.mp3' },
  { id: 'placeholder-104', title: 'Touch', artist: 'KATSEYE', filename: 'KATSEYE - Touch.mp3' },
  { id: 'placeholder-105', title: 'You And Me', artist: 'Lifehouse', filename: 'Lifehouse - You And Me.mp3' },
  { id: 'placeholder-106', title: "We Can't Stop", artist: 'Miley Cyrus', filename: 'Miley Cyrus - We Can\'t Stop.mp3' },
  { id: 'placeholder-107', title: 'Oceans & Engines', artist: 'NIKI', filename: 'NIKI - Oceans & Engines.mp3' },
  { id: 'placeholder-108', title: 'If I Could Fly', artist: 'One Direction', filename: 'One Direction - If I Could Fly.mp3' },
  { id: 'placeholder-109', title: 'Ready to Run', artist: 'One Direction', filename: 'One Direction - Ready to Run.mp3' },
  { id: 'placeholder-110', title: 'The Only Exception', artist: 'Paramore', filename: 'Paramore - The Only Exception.mp3' },
  { id: 'placeholder-111', title: 'APT', artist: 'Rose', filename: 'Rose - APT.mp3' },
  { id: 'placeholder-112', title: 'Look After You', artist: 'The Fray', filename: 'The Fray - Look After You.mp3' },
  { id: 'placeholder-113', title: 'A Thousand Miles', artist: 'Vanessa Carlton', filename: 'Vanessa Carlton - A Thousand Miles.mp3' },
  { id: 'placeholder-114', title: 'Hulaan', artist: 'Janine', filename: 'Janine - Hulaan.mp3' },
  { id: 'placeholder-115', title: 'YOUTH', artist: 'Troye Sivan', filename: 'Troye Sivan - YOUTH.mp3' },
  { id: 'placeholder-116', title: 'Angels Brought Me Here', artist: 'Guy Sebastian', filename: 'Guy Sebastian - Angels Brought Me Here.mp3' },
  { id: 'placeholder-117', title: 'Not Like Us', artist: 'Kendrick Lamar', filename: 'Kendrick Lamar - Not Like Us.mp3' },
  { id: 'placeholder-118', title: 'intro (end of the world)', artist: 'Ariana Grande', filename: 'Ariana Grande - intro (end of the world).mp3' },
  { id: 'placeholder-119', title: 'Pick Up', artist: 'Illest Morena', filename: 'Illest Morena - Pick Up.mp3' },
  { id: 'placeholder-120', title: 'Faded (Raw)', artist: 'Illest Morena', filename: 'Illest Morena - Faded (Raw).mp3' },
  { id: 'placeholder-121', title: 'Midnight Sky', artist: 'Unique Salonga', filename: 'Unique Salonga - Midnight Sky.mp3' },
  { id: 'placeholder-122', title: 'Lagi', artist: 'BINI', filename: 'BINI - Lagi.mp3' },
  { id: 'placeholder-123', title: 'The Archer', artist: 'Taylor Swift', filename: 'Taylor Swift - The Archer.mp3' },
  { id: 'placeholder-124', title: 'Good Days', artist: 'SZA', filename: 'SZA - Good Days.mp3' },
  { id: 'placeholder-125', title: 'Happy Now', artist: 'Kali Uchis', filename: 'Kali Uchis - Happy Now.mp3' },
  { id: 'placeholder-126', title: 'telepatía', artist: 'Kali Uchis', filename: 'Kali Uchis - telepatia.mp3' },
  { id: 'placeholder-127', title: 'Moonlight', artist: 'Kali Uchis', filename: 'Kali Uchis - Moonlight.mp3' },
  { id: 'placeholder-128', title: 'Alipin', artist: 'Shamrock', filename: 'Shamrock - Alipin.mp3' },
  { id: 'placeholder-129', title: 'the perfect pair', artist: 'beabadoobee', filename: 'beabadoobee - the perfect pair.mp3' },
  { id: 'placeholder-130', title: 'sol at luna', artist: 'geiko', filename: 'geiko - sol at luna.mp3' },
  { id: 'placeholder-131', title: 'All I Want', artist: 'Kodaline', filename: 'Kodaline - All I Want.mp3' },
  { id: 'placeholder-132', title: 'Tenerife Sea', artist: 'Ed Sheeran', filename: 'Ed Sheeran - Tenerife Sea.mp3' },
  { id: 'placeholder-133', title: 'Best Part (feat. H.E.R.)', artist: 'Daniel Caesar', filename: 'Daniel Caesar - Best Part (feat. H.E.R.).mp3' },
  { id: 'placeholder-134', title: 'NVMD', artist: 'Denise Julia', filename: 'Denise Julia - NVMD.mp3' },
  { id: 'placeholder-135', title: 'Babaero', artist: 'Hev Abi', filename: 'Hev Abi - Babaero.mp3' },
  { id: 'placeholder-136', title: 'Wish You Were Here', artist: 'Neck Deep', filename: 'Neck Deep - Wish You Were Here.mp3' },
  { id: 'placeholder-137', title: 'On The Ground', artist: 'ROSE', filename: 'ROSE - On The Ground.mp3' },
  { id: 'placeholder-138', title: 'Untitled', artist: 'Rex Orange County', filename: 'Rex Orange County - Untitled.mp3' },
  { id: 'placeholder-139', title: 'Pyramids', artist: 'Frank Ocean', filename: 'Frank Ocean - Pyramids.mp3' },
  { id: 'placeholder-140', title: 'Maybe This Time', artist: 'Sarah Geronimo', filename: 'Sarah Geronimo - Maybe This Time.mp3' },
  { id: 'placeholder-141', title: 'Starting over Again', artist: 'Toni Gonzaga', filename: 'Toni Gonzaga - Starting over Again.mp3' },
  { id: 'placeholder-142', title: 'Nobody Knows', artist: 'KISS OF LIFE', filename: 'KISS OF LIFE - Nobody Knows.mp3' },
  { id: 'placeholder-143', title: 'Sometimes', artist: 'Britney Spears', filename: 'Britney Spears - Sometimes.mp3' },
  { id: 'placeholder-144', title: 'Chasing Pavements', artist: 'Adele', filename: 'Adele - Chasing Pavements.mp3' },
];

const defaultAvailableSongs = defaultAvailableSongsRaw.map(song => ({
  ...song,
  src: encodeURI(supabaseBase + song.filename), // Ensure filename is URL-encoded
  // videoSrc is no longer per-song, it's a global rotating background
}));

// AddSongsToPlaylistModal Component (for adding multiple songs from available to a selected playlist)
const AddSongsToPlaylistModal = ({ show, onClose, availableSongs, currentSongsInPlaylist, onAddSongs }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSongIds, setSelectedSongIds] = useState([]);

    // Effect to reset selected songs and filter when modal opens/closes
    useEffect(() => {
        if (show) {
            // Initialize selected songs with those already in the playlist
            const initialSelected = currentSongsInPlaylist.map(song => song.id);
            setSelectedSongIds(initialSelected);
            setSearchTerm(''); // Clear search term on open
        }
    }, [show, currentSongsInPlaylist]);

    const filteredSongs = availableSongs.filter(song =>
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCheckboxChange = (songId) => {
        setSelectedSongIds(prev =>
            prev.includes(songId)
                ? prev.filter(id => id !== songId)
                : [...prev, songId]
        );
    };

    const handleAddClick = () => {
        const songsToAdd = selectedSongIds
            .filter(id => !currentSongsInPlaylist.some(s => s.id === id)) // Only add new songs
            .map(id => availableSongs.find(song => song.id === id));
        onAddSongs(songsToAdd.filter(Boolean)); // Filter out any undefined if find fail
        onClose();
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-zinc-800 p-6 rounded-lg shadow-xl w-[500px] max-h-[80vh] flex flex-col">
                <h3 className="text-xl font-bold mb-4 text-white">Add Songs to Playlist</h3>
                <div className="relative mb-4">
            
                    <input
                        type="text"
                        placeholder="Search"
                        className="w-full pl-4 pr-4 py-2 rounded-md bg-zinc-700 text-white border border-zinc-600 focus:outline-none focus:border-green-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <ul className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2 mb-4">
                    {filteredSongs.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center">No songs found.</p>
                    ) : (
                        filteredSongs.map(song => {
                            const isAlreadyInPlaylist = currentSongsInPlaylist.some(s => s.id === song.id);
                            const isSelected = selectedSongIds.includes(song.id);
                            return (
                                <li
                                    key={song.id}
                                    className={`flex items-center p-3 rounded-md transition-colors duration-200 ${
                                        isAlreadyInPlaylist ? 'bg-zinc-600 text-gray-500' : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600 cursor-pointer'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected || isAlreadyInPlaylist}
                                        onChange={() => handleCheckboxChange(song.id)}
                                        disabled={isAlreadyInPlaylist}
                                        className="mr-3 h-5 w-5 rounded text-green-500 focus:ring-green-500 bg-zinc-600 border-zinc-500 cursor-pointer disabled:cursor-not-allowed"
                                    />
                                    <div className="flex-1">
                                        <p className="font-semibold text-lg">{song.title}</p>
                                        <p className="text-sm text-gray-400">{song.artist}</p>
                                    </div>
                                    {isAlreadyInPlaylist && <span className="text-green-400 text-sm">Added</span>}
                                </li>
                            );
                        })
                    )}
                </ul>
                <div className="flex justify-end space-x-4 mt-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-600 text-white rounded-full hover:bg-gray-500 transition-colors duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAddClick}
                        className="px-6 py-2 bg-green-500 text-black font-bold rounded-full hover:bg-green-400 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={selectedSongIds.filter(id => !currentSongsInPlaylist.some(s => s.id === id)).length === 0}
                    >
                        Add Selected Songs
                    </button>
                </div>
            </div>
        </div>
    );
};

// SelectPlaylistForSongModal Component (for adding a single song to any playlist)
const SelectPlaylistForSongModal = ({ show, onClose, playlists, songToAdd, onAddSingleSongToPlaylist }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-zinc-800 p-6 rounded-lg shadow-xl w-96 max-h-[80vh] flex flex-col">
                <h3 className="text-xl font-bold mb-4 text-white">Add "{songToAdd?.title}" to...</h3>
                <ul className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2 mb-4">
                    {playlists.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center">No playlists available. Create one first!</p>
                    ) : (
                        playlists.map(pl => (
                            <li
                                key={pl.id}
                                onClick={() => onAddSingleSongToPlaylist(pl.id, songToAdd)}
                                className="p-3 rounded-md cursor-pointer bg-zinc-700 text-gray-300 hover:bg-zinc-600 transition-colors duration-200"
                            >
                                {pl.name}
                            </li>
                        ))
                    )}
                </ul>
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-600 text-white rounded-full hover:bg-gray-500 transition-colors duration-200"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};


// Main App Component
const App = () => {
    // Firebase states
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false); // To ensure Firebase is initialized and auth is ready

    // Login states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [isLoadingAuth, setIsLoadingAuth] = useState(true); // New state for initial auth loading

    // Player states
    const [playlist, setPlaylist] = useState([]); // This is the currently active playlist in the player
    const [currentSongIndex, setCurrentSongIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [repeatMode, setRepeatMode] = useState('off'); // 'off', 'one', 'all'
    const [isShuffling, setIsShuffling] = useState(false);
    const [originalPlaylist, setOriginalPlaylist] = useState([]); // Used for shuffle logic
    const [shuffledPlaylist, setShuffledPlaylist] = useState([]);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.7);
    const [prevVolume, setPrevVolume] = useState(0.7);
    const audioRef = useRef(null);
    const videoRef = useRef(null); // Ref for the video element

    // Video background state
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

    // Firebase Playlist states
    const [userPlaylists, setUserPlaylists] = useState([]); // List of playlists fetched from Firebase
    const [selectedFirebasePlaylistId, setSelectedFirebasePlaylistId] = useState(null);
    const [selectedFirebasePlaylistSongs, setSelectedFirebasePlaylistSongs] = useState([]); // Songs of the currently selected Firebase playlist
    const [showAddSongsToPlaylistModal, setShowAddSongsToPlaylistModal] = useState(false); // For multi-select modal
    const [showSelectPlaylistForSongModal, setShowSelectPlaylistForSongModal] = useState(false); // For single song add modal
    const [songToAddToSpecificPlaylist, setSongToAddToSpecificPlaylist] = useState(null); // The song clicked from available songs

    // New state for main song list search
    const [mainSearchTerm, setMainSearchTerm] = useState('');

    // Determine the current song being played from the active playlist
    const currentSong = playlist[currentSongIndex];


    // --- Firebase Initialization and Authentication ---
    useEffect(() => {
        try {
            const firebaseApp = initializeApp(firebaseConfig);
            const database = getDatabase(firebaseApp);
            const authentication = getAuth(firebaseApp);

            setDb(database);
            setAuth(authentication);

            // Listen for auth state changes to persist login
            const unsubscribe = onAuthStateChanged(authentication, (user) => {
                if (user) {
                    setUserId(user.uid);
                } else {
                    setUserId(null); // User is logged out
                }
                setIsAuthReady(true);
                setIsLoadingAuth(false); // Authentication check is complete
            });

            return () => unsubscribe(); // Cleanup auth listener
        } catch (error) {
            console.error("Firebase initialization error:", error);
            setIsLoadingAuth(false); // Stop loading even if there's an error
        }
    }, []); // Run only once on component mount

    // --- Email/Password Login Function ---
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError(''); // Clear previous errors
        if (!auth) {
            setLoginError("Firebase Auth not initialized.");
            return;
        }
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // User is automatically set by onAuthStateChanged
            console.log("Logged in successfully!");
        } catch (error) {
            console.error("Login error:", error);
            let errorMessage = "failed mali password";
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = "Invalid email or password.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "Invalid email format.";
            }
            setLoginError(errorMessage);
        }
    };

    // --- Logout Function ---
    const handleLogout = async () => {
        if (!auth) {
            console.error("Firebase Auth not initialized.");
            return;
        }
        try {
            await signOut(auth);
            // userId will be set to null by onAuthStateChanged
            setPlaylist(defaultAvailableSongs); // Reset playlist to available songs on logout
            setOriginalPlaylist(defaultAvailableSongs);
            setCurrentSongIndex(0);
            setIsPlaying(false);
            setSelectedFirebasePlaylistId(null);
            setSelectedFirebasePlaylistSongs([]); // Clear selected playlist songs
            console.log("Logged out successfully!");
        } catch (error) {
            console.error("Logout error:", error);
        }
    };


    // --- Load Playlists from Firebase ---
    useEffect(() => {
        if (isAuthReady && db && userId) {
            const playlistsRef = ref(db, `artifacts/${appId}/users/${userId}/playlists`);
            const unsubscribe = onValue(playlistsRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const loadedPlaylists = Object.keys(data).map(key => ({
                        id: key,
                        ...data[key]
                    }));
                    setUserPlaylists(loadedPlaylists);

                    // If a playlist was previously selected, try to reload its songs
                    if (selectedFirebasePlaylistId) {
                        const currentSelected = loadedPlaylists.find(pl => pl.id === selectedFirebasePlaylistId);
                        if (currentSelected) {
                            setPlaylist(currentSelected.songs || []);
                            setOriginalPlaylist(currentSelected.songs || []);
                            setSelectedFirebasePlaylistSongs(currentSelected.songs || []);
                        } else {
                            // Selected playlist was deleted or not found, revert to available songs
                            setSelectedFirebasePlaylistId(null);
                            setPlaylist(defaultAvailableSongs);
                            setOriginalPlaylist(defaultAvailableSongs);
                            setSelectedFirebasePlaylistSongs([]);
                            setCurrentSongIndex(0);
                            setIsPlaying(false);
                        }
                    }
                } else {
                    setUserPlaylists([]);
                    // If no playlists, ensure player shows available songs
                    setSelectedFirebasePlaylistId(null);
                    setPlaylist(defaultAvailableSongs);
                    setOriginalPlaylist(defaultAvailableSongs);
                    setSelectedFirebasePlaylistSongs([]);
                    setCurrentSongIndex(0);
                    setIsPlaying(false);
                }
            }, (error) => {
                console.error("Error fetching playlists from Firebase:", error);
            });

            return () => unsubscribe(); // Cleanup listener
        } else if (isAuthReady && !userId) {
            // If auth is ready but no user, clear playlists and show default available songs
            setUserPlaylists([]);
            setSelectedFirebasePlaylistId(null);
            setPlaylist(defaultAvailableSongs);
            setOriginalPlaylist(defaultAvailableSongs);
            setSelectedFirebasePlaylistSongs([]);
            setCurrentSongIndex(0);
            setIsPlaying(false);
        }
    }, [isAuthReady, db, userId, appId, selectedFirebasePlaylistId]); // Added selectedFirebasePlaylistId to dependency array

    // --- Initial Song Loading (for default view) ---
    useEffect(() => {
        // This effect ensures that defaultAvailableSongs are loaded when the component mounts
        // and no Firebase playlist is selected initially.
        if (!selectedFirebasePlaylistId) {
            setPlaylist(defaultAvailableSongs);
            setOriginalPlaylist(defaultAvailableSongs);
        }
    }, [selectedFirebasePlaylistId]); // Only re-run if selectedFirebasePlaylistId changes

    // --- Player Logic ---
    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch(e => console.error("Error playing audio:", e));
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying, currentSongIndex, playlist]); // Re-run when song changes or playlist updates

    // Effect to control video background rotation
    useEffect(() => {
        if (defaultVideoSources.length > 0) {
            const interval = setInterval(() => {
                setCurrentVideoIndex(prevIndex =>
                    (prevIndex + 1) % defaultVideoSources.length
                );
            }, 15000); // Change video every 15 seconds

            return () => clearInterval(interval); // Cleanup interval on component unmount
        }
    }, [defaultVideoSources.length]);

    // Effect to update video source when index changes
    useEffect(() => {
        if (videoRef.current && defaultVideoSources.length > 0) {
            videoRef.current.src = defaultVideoSources[currentVideoIndex];
            videoRef.current.load(); // Explicitly load the new video source
            // Only play if audio is also playing, otherwise keep it paused/reset
            if (isPlaying) {
                videoRef.current.play().catch(e => console.error("Error playing video:", e));
            } else {
                videoRef.current.pause();
                videoRef.current.currentTime = 0; // Reset video when paused
            }
        }
    }, [currentVideoIndex, isPlaying, defaultVideoSources]); // Depend on currentVideoIndex, isPlaying, and defaultVideoSources

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    const handlePlayPause = useCallback(() => {
        if (playlist.length === 0) return;
        setIsPlaying(prev => !prev);
    }, [playlist.length]);

    const playSong = useCallback((index) => {
        if (index >= 0 && index < playlist.length) {
            setCurrentSongIndex(index);
            setIsPlaying(true);
        }
    }, [playlist.length]);

    const handleNext = useCallback(() => {
        if (playlist.length === 0) return;

        let nextIndex;
        if (isShuffling) {
            const currentShuffledIndex = shuffledPlaylist.findIndex(song => song.id === playlist[currentSongIndex].id);
            nextIndex = (currentShuffledIndex + 1) % shuffledPlaylist.length;
            setCurrentSongIndex(playlist.findIndex(song => song.id === shuffledPlaylist[nextIndex].id));
        } else {
            nextIndex = (currentSongIndex + 1) % playlist.length;
            setCurrentSongIndex(nextIndex);
        }
        setIsPlaying(true);
    }, [currentSongIndex, playlist, isShuffling, shuffledPlaylist]);

    const handlePrev = useCallback(() => {
        if (playlist.length === 0) return;

        let prevIndex;
        if (isShuffling) {
            const currentShuffledIndex = shuffledPlaylist.findIndex(song => song.id === playlist[currentSongIndex].id);
            prevIndex = (currentShuffledIndex - 1 + shuffledPlaylist.length) % shuffledPlaylist.length;
            setCurrentSongIndex(playlist.findIndex(song => song.id === shuffledPlaylist[prevIndex].id));
        } else {
            prevIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
            setCurrentSongIndex(prevIndex);
        }
        setIsPlaying(true);
    }, [currentSongIndex, playlist, isShuffling, shuffledPlaylist]);

    const handleSongEnded = useCallback(() => {
        if (playlist.length === 0) {
            setIsPlaying(false);
            return;
        }

        if (repeatMode === 'one') {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
        } else if (repeatMode === 'all' || isShuffling) {
            handleNext();
        } else {
            if (currentSongIndex === playlist.length - 1) {
                setIsPlaying(false);
            } else {
                handleNext();
            }
        }
    }, [currentSongIndex, playlist.length, repeatMode, isShuffling, handleNext]);

    const handleRepeat = useCallback(() => {
        setRepeatMode(prev => {
            if (prev === 'off') return 'all';
            if (prev === 'all') return 'one';
            return 'off';
        });
    }, []);

    const handleShuffle = useCallback(() => {
        setIsShuffling(prev => {
            if (!prev) {
                const shuffled = [...originalPlaylist].sort(() => Math.random() - 0.5);
                setShuffledPlaylist(shuffled);
                const currentSongInShuffled = shuffled.findIndex(song => song.id === playlist[currentSongIndex].id);
                setCurrentSongIndex(playlist.findIndex(song => song.id === shuffled[currentSongInShuffled].id));
            } else {
                const currentSongId = playlist[currentSongIndex].id;
                const originalIndex = originalPlaylist.findIndex(song => song.id === currentSongId);
                setCurrentSongIndex(originalIndex);
            }
            return !prev;
        });
    }, [currentSongIndex, playlist, originalPlaylist]);

    // --- Firebase Playlist Management ---
    const handleCreatePlaylist = useCallback(async () => {
        if (!db || !userId) {
            console.error("Firebase not initialized or user not authenticated.");
            return;
        }

        const playlistName = prompt("Enter a name for your new playlist:");
        if (playlistName && playlistName.trim() !== '') {
            try {
                const playlistsRef = ref(db, `artifacts/${appId}/users/${userId}/playlists`);
                await push(playlistsRef, {
                    name: playlistName.trim(),
                    songs: [] // Initialize with an empty array
                });
                console.log("Playlist created successfully!");
            } catch (error) {
                console.error("Error creating playlist:", error);
            }
        }
    }, [db, userId, appId]);

    const selectFirebasePlaylist = useCallback(async (playlistId) => {
        if (!db || !userId) {
            console.error("Firebase not initialized or user not authenticated.");
            return;
        }
        setSelectedFirebasePlaylistId(playlistId);

        try {
            const playlistRef = ref(db, `artifacts/${appId}/users/${userId}/playlists/${playlistId}`);
            const snapshot = await get(playlistRef);
            const data = snapshot.val();
            const songs = data && data.songs ? data.songs : []; // Ensure songs is an array
            setPlaylist(songs); // Load songs from selected Firebase playlist into player
            setOriginalPlaylist(songs); // Update original for shuffle
            setSelectedFirebasePlaylistSongs(songs); // Store for modal
            setCurrentSongIndex(0);
            setIsPlaying(false);
        }
        catch (error) {
            console.error("Error loading selected playlist:", error);
        }
    }, [db, userId, appId]);

    // Function to delete a song from the currently selected Firebase playlist
    const handleDeleteSongFromPlaylist = useCallback(async (songIdToDelete) => {
        if (!db || !userId || !selectedFirebasePlaylistId) {
            console.error("Cannot delete song: Firebase not ready, user not authenticated, or no playlist selected.");
            return;
        }

        try {
            const playlistRef = ref(db, `artifacts/${appId}/users/${userId}/playlists/${selectedFirebasePlaylistId}`);
            const snapshot = await get(playlistRef);
            const currentPlaylistData = snapshot.val();
            const currentSongs = currentPlaylistData && currentPlaylistData.songs ? currentPlaylistData.songs : [];

            const updatedSongs = currentSongs.filter(song => song.id !== songIdToDelete);

            await update(playlistRef, { songs: updatedSongs });
            console.log(`Song with ID "${songIdToDelete}" deleted from playlist.`);

            // Explicitly update local state after Firebase write
            setPlaylist(updatedSongs);
            setOriginalPlaylist(updatedSongs);
            setSelectedFirebasePlaylistSongs(updatedSongs);

            // If the deleted song was the current one, reset playback
            if (currentSong && currentSong.id === songIdToDelete) {
                setIsPlaying(false);
                setCurrentSongIndex(0); // Reset to first song or no song
            } else if (currentSongIndex >= updatedSongs.length && updatedSongs.length > 0) {
                // Adjust current index if it's out of bounds after deletion
                setCurrentSongIndex(updatedSongs.length - 1);
            } else if (updatedSongs.length === 0) {
                setCurrentSongIndex(0);
                setIsPlaying(false);
            }

        } catch (error) {
            console.error("Error deleting song from playlist:", error);
        }
    }, [db, userId, appId, selectedFirebasePlaylistId, currentSong, currentSongIndex]);

    // Function to delete an entire playlist from Firebase
    const handleDeletePlaylist = useCallback(async (playlistIdToDelete, playlistName) => {
        if (!db || !userId) {
            console.error("Firebase not ready or user not authenticated.");
            return;
        }

        const confirmDelete = prompt(`Are you sure you want to delete the playlist "${playlistName}"? Type "bam" to confirm.`);

        if (confirmDelete && confirmDelete.toLowerCase() === 'bam') {
            try {
                const playlistRefToDelete = ref(db, `artifacts/${appId}/users/${userId}/playlists/${playlistIdToDelete}`);
                await remove(playlistRefToDelete);
                console.log(`Playlist "${playlistName}" deleted successfully!`);

                // If the deleted playlist was the currently selected one, clear the player's playlist
                if (selectedFirebasePlaylistId === playlistIdToDelete) {
                    setSelectedFirebasePlaylistId(null);
                    setPlaylist(defaultAvailableSongs); // Revert to showing available songs
                    setOriginalPlaylist(defaultAvailableSongs);
                    setSelectedFirebasePlaylistSongs([]);
                    setCurrentSongIndex(0);
                    setIsPlaying(false);
                }
            } catch (error) {
                console.error("Error deleting playlist:", error);
            }
        } else {
            console.log("Playlist deletion cancelled.");
        }
    }, [db, userId, appId, selectedFirebasePlaylistId]);

    // --- Add Songs to Playlist Modal Logic (for multi-select from selected playlist) ---
    const handleOpenAddSongsToPlaylistModal = useCallback(() => {
        if (!selectedFirebasePlaylistId) {
            // This alert should ideally not be hit if the button is only shown when a playlist is selected
            alert("Please select a playlist first to add songs.");
            return;
        }
        setShowAddSongsToPlaylistModal(true);
    }, [selectedFirebasePlaylistId]);

    const handleAddSelectedSongsToPlaylist = useCallback(async (songsToAdd) => {
        if (!db || !userId || !selectedFirebasePlaylistId) {
            console.error("Cannot add songs: Firebase not ready, user not authenticated, or no playlist selected.");
            return;
        }

        try {
            const playlistRef = ref(db, `artifacts/${appId}/users/${userId}/playlists/${selectedFirebasePlaylistId}`);
            const snapshot = await get(playlistRef);
            const currentPlaylistData = snapshot.val();
            const currentSongs = currentPlaylistData && currentPlaylistData.songs ? currentPlaylistData.songs : [];

            const newSongs = songsToAdd.filter(songToAdd =>
                !currentSongs.some(existingSong => existingSong.id === songToAdd.id)
            );

            if (newSongs.length === 0) {
                console.warn("No new songs to add or all selected songs are already in the playlist.");
                return;
            }

            const updatedSongs = [...currentSongs, ...newSongs];
            await update(playlistRef, { songs: updatedSongs });
            console.log(`Added ${newSongs.length} song(s) to playlist ID: ${selectedFirebasePlaylistId}.`);

            // Explicitly update local state after Firebase write
            setPlaylist(updatedSongs);
            setOriginalPlaylist(updatedSongs);
            setSelectedFirebasePlaylistSongs(updatedSongs);

        } catch (error) {
            console.error("Error adding songs to playlist:", error);
        }
    }, [db, userId, appId, selectedFirebasePlaylistId]);

    // --- Add Single Song to Playlist Modal Logic (from Available Songs section) ---
    const handleOpenSelectPlaylistForSongModal = useCallback((song) => {
        setSongToAddToSpecificPlaylist(song);
        setShowSelectPlaylistForSongModal(true);
    }, []);

    const handleAddSingleSongToPlaylist = useCallback(async (playlistId, songToAdd) => {
        if (!db || !userId) {
            console.error("Firebase not ready or user not authenticated.");
            return;
        }

        try {
            const playlistRef = ref(db, `artifacts/${appId}/users/${userId}/playlists/${playlistId}`);
            const snapshot = await get(playlistRef);
            const currentPlaylistData = snapshot.val();
            const currentSongs = currentPlaylistData && currentPlaylistData.songs ? currentPlaylistData.songs : [];

            // Prevent adding duplicate songs to the playlist
            const isDuplicate = currentSongs.some(song => song.id === songToAdd.id);
            if (isDuplicate) {
                console.warn(`Song "${songToAdd.title}" is already in playlist ID: ${playlistId}.`);
                setShowSelectPlaylistForSongModal(false); // Close modal even if duplicate
                return;
            }

            const updatedSongs = [...currentSongs, songToAdd];
            await update(playlistRef, { songs: updatedSongs });
            console.log(`Song "${songToAdd.title}" added to playlist ID: ${playlistId}.`);

            // If the currently active playlist is the one we just updated, refresh it
            if (selectedFirebasePlaylistId === playlistId) {
                setPlaylist(updatedSongs);
                setOriginalPlaylist(updatedSongs);
                setSelectedFirebasePlaylistSongs(updatedSongs);
            }
            setShowSelectPlaylistForSongModal(false); // Close modal after adding
        } catch (error) {
            console.error("Error adding single song to playlist:", error);
        }
    }, [db, userId, appId, selectedFirebasePlaylistId]);


    // --- Utility Functions ---
    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) setDuration(audioRef.current.duration);
    };

    const handleSeek = (e) => {
        if (audioRef.current) audioRef.current.currentTime = e.target.value;
    };

    const handleVolumeChange = (e) => {
        setVolume(parseFloat(e.target.value));
    };

    const toggleMute = () => {
        if (volume > 0) {
            setPrevVolume(volume);
            setVolume(0);
        } else {
            setVolume(prevVolume);
        }
    };

    // Filtered list for the main display based on search term
    const filteredMainSongs = playlist.filter(song =>
        song.title.toLowerCase().includes(mainSearchTerm.toLowerCase()) ||
        song.artist.toLowerCase().includes(mainSearchTerm.toLowerCase())
    );

    // --- Function to go back to Available Songs ---
    const handleBackToAvailableSongs = useCallback(() => {
        setSelectedFirebasePlaylistId(null); // Deselect any playlist
        setPlaylist(defaultAvailableSongs); // Set main playlist to all available songs
        setOriginalPlaylist(defaultAvailableSongs);
        setSelectedFirebasePlaylistSongs([]); // Clear selected playlist songs state
        setCurrentSongIndex(0);
        setIsPlaying(false);
        setMainSearchTerm(''); // Clear search term
    }, []);


    // --- Conditional Rendering for Login/App ---
    if (isLoadingAuth) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <p className="text-xl">Made with love, I love you so much, my love!</p>
            </div>
        );
    }

    if (!userId) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="bg-zinc-900 p-8 rounded-lg shadow-xl w-96">
                    <h2 className="text-3xl font-bold mb-6 text-white text-center"></h2>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-gray-400 text-sm font-bold mb-2">
                                Email:
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="shadow appearance-none border border-zinc-700 rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-zinc-800"
                                placeholder=""
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-gray-400 text-sm font-bold mb-2">
                                Password:
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="shadow appearance-none border border-zinc-700 rounded w-full py-2 px-3 text-white mb-3 leading-tight focus:outline-none focus:shadow-outline bg-zinc-800"
                                placeholder=""
                                required
                            />
                        </div>
                        {loginError && <p className="text-red-500 text-sm text-center">{loginError}</p>}
                        <button
                            type="submit"
                            className="w-full bg-green-500 text-black font-bold py-2 px-4 rounded-full hover:bg-green-400 transition-colors duration-300 focus:outline-none focus:shadow-outline"
                        >
                            Log In
                        </button>
                    </form>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-black text-white font-inter flex overflow-hidden"> {/* Added overflow-hidden */}
            {/* Left Sidebar for Playlists */}
            <aside className="w-64 bg-zinc-900 p-4 border-r border-zinc-800 flex flex-col h-screen overflow-hidden"> {/* Added h-screen, overflow-hidden */}
                <h2 className="text-2xl font-bold mb-6 text-white">Defnotgg</h2>
                <button
                    onClick={handleCreatePlaylist}
                    className="flex items-center justify-center px-4 py-2 mb-4 bg-green-500 text-black font-bold rounded-full hover:bg-green-400 transition-all duration-300 text-base"
                    title="Create a new empty playlist"
                >
                    <Plus size={20} className="mr-2" /> Create Playlist
                </button>
                <ul className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2 min-h-0"> {/* Added min-h-0 */}
                    {userPlaylists.length === 0 ? (
                        <p className="text-gray-400 text-sm">No saved playlists. Create one!</p>
                    ) : (
                        userPlaylists.map(pl => (
                            <li
                                key={pl.id}
                                className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-all duration-200 ${
                                    selectedFirebasePlaylistId === pl.id
                                        ? 'bg-zinc-700 text-white'
                                        : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
                                }`}
                            >
                                <span onClick={() => selectFirebasePlaylist(pl.id)} className="flex-1 truncate pr-2">
                                    {pl.name}
                                </span>
                                <button
                                    onClick={() => handleDeletePlaylist(pl.id, pl.name)}
                                    className="p-1 rounded-full bg-red-600 text-white hover:bg-red-500 transition-colors duration-200"
                                    title={`Delete playlist "${pl.name}"`}
                                >
                                    <X size={16} />
                                </button>
                            </li>
                        ))
                    )}
                </ul>
                <div className="mt-auto pt-4 border-t border-zinc-800 text-gray-500 text-xs flex items-center justify-between flex-shrink-0"> {/* Added flex-shrink-0 */}
                  
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-full bg-zinc-700 text-gray-300 hover:bg-zinc-600 transition-colors duration-200"
                        title="Logout"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-4 sm:p-8 flex flex-col md:flex-row h-screen min-h-0"> {/* Changed to flex-row on md screens */}

                {/* Middle Section (Available Songs / Current Playlist) */}
                <div className="w-full md:w-1/2 flex flex-col h-full min-h-0 md:pr-4"> {/* md:w-1/2, md:pr-4 for spacing */}
                    <div className="bg-zinc-800 rounded-lg p-6 shadow-inner flex-1 flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-4 flex-shrink-0">
                            <h3 className="text-2xl font-bold text-white">
                                {selectedFirebasePlaylistId ? 'Songs in Selected Playlist' : 'Available Songs'}
                            </h3>
                            {selectedFirebasePlaylistId && (
                                <button
                                    onClick={handleOpenAddSongsToPlaylistModal}
                                    className="flex items-center px-4 py-2 bg-green-500 text-black font-bold rounded-full hover:bg-green-400 transition-colors duration-300 text-base"
                                    title="Add songs to this playlist"
                                >
                                    <Plus size={20} className="mr-2" /> Add Songs
                                </button>
                            )}
                        </div>

                        {/* Search bar for the main song list */}
                        <div className="relative mb-4 flex-shrink-0">
                    
                            <input
                                type="text"
                                placeholder="Search"
                                className="w-full pl-4 pr-4 py-2 rounded-md bg-zinc-700 text-white border border-zinc-600 focus:outline-none focus:border-green-500"
                                value={mainSearchTerm}
                                onChange={(e) => setMainSearchTerm(e.target.value)}
                            />
                        </div>

                        {filteredMainSongs.length === 0 ? (
                            <p className="text-gray-400 text-center flex-1 flex items-center justify-center">
                                {selectedFirebasePlaylistId ? 'empty' : 'No songs available.'}
                            </p>
                        ) : (
                            <ul className="space-y-3 overflow-y-auto custom-scrollbar pr-2 flex-1 min-h-0">
                                {filteredMainSongs.map((song, index) => (
                                    <li
                                        key={song.id}
                                        className={`flex items-center justify-between p-4 rounded-md transition-all duration-200 ${
                                            currentSong && currentSong.id === song.id
                                                ? 'bg-zinc-700 text-white'
                                                : 'bg-zinc-900 text-gray-300 hover:bg-zinc-700'
                                        }`}
                                    >
                                        <div className="flex-1 truncate" onClick={() => playSong(playlist.findIndex(s => s.id === song.id))}>
                                            <p className="font-semibold text-lg">{song.title}</p>
                                            <p className="text-sm text-gray-400">{song.artist}</p>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            {currentSong && currentSong.id === song.id && isPlaying && (
                                                <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse-slow"></div>
                                            )}
                                            {selectedFirebasePlaylistId ? (
                                                <button
                                                    onClick={() => handleDeleteSongFromPlaylist(song.id)}
                                                    className="p-2 rounded-full bg-red-600 text-white hover:bg-red-500 transition-colors duration-200"
                                                    title="Remove from playlist"
                                                >
                                                    <X size={16} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleOpenSelectPlaylistForSongModal(song)} // Changed to new modal trigger
                                                    className="p-2 rounded-full bg-green-600 text-white hover:bg-green-500 transition-colors duration-200"
                                                    title="Add to playlist"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

            {/* Right Section (Player and Current Song Display) */}
            <div className="w-full md:w-1/2 flex flex-col h-full min-h-0 md:pl-4 mt-4 md:mt-0"> {/* md:w-1/2, md:pl-4, mt-4/md:mt-0 for responsiveness */}
                {/* Header (Bamtify title and Back button) */}
               <header className="flex flex-col sm:flex-row items-center justify-between flex-shrink-0 mb-4">
    <h1 className="text-4xl sm:text-5xl font-extrabold flex-1 relative text-green-500">
        Bamtify
        {/* Luffy's Straw Hat Overlay */}
        <img
            src="/images/luffy.gif" /* ENSURE THIS PATH IS CORRECT, e.g., "/images/luffyhat.png" */
            alt="Luffy's Straw Hat"
            /* Tailwind classes for positioning and sizing */
            className="absolute top-[-25px]  left-12 w-20 h-auto z-10" /* Adjusted values, you will need to fine-tune */
        />
    </h1>
    {selectedFirebasePlaylistId && ( // Show back button only when a playlist is selected
        <button
            onClick={handleBackToAvailableSongs}
            className="flex items-center px-4 py-2 bg-zinc-700 text-gray-300 font-bold rounded-full hover:bg-zinc-600 transition-colors duration-300 text-base ml-4"
            title="Back to Available Songs"
        >
            <ArrowLeft size={20} className="mr-2" /> Back
        </button>
    )}
</header>
                    {/* Current Song Display & Video Thumbnail */}
                    <div className="relative bg-zinc-800 rounded-lg p-4 shadow-inner flex-shrink-0 mb-4 overflow-hidden" style={{ paddingTop: '56.25%' }}> {/* 16:9 aspect ratio */}
                        {defaultVideoSources.length > 0 && (
                            <video
                                ref={videoRef}
                                src={defaultVideoSources[currentVideoIndex]}
                                className="absolute top-0 left-0 w-full h-full object-cover rounded-lg" // object-cover to fill container
                                autoPlay
                                loop
                                muted
                                playsInline // Important for mobile autoplay
                                onError={(e) => console.error("Error loading video:", e)}
                            >
                                Your browser does not support the video tag.
                            </video>
                        )}
                        {/* Overlay for song info and music icon */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-40 rounded-lg">
                            <Music size={60} className="text-gray-400 mb-2" />
                            <h2 className="text-2xl font-bold mb-1 text-white text-center px-2">{currentSong ? currentSong.title : 'No song selected'}</h2>
                            <p className="text-lg text-gray-400 text-center px-2">{currentSong ? currentSong.artist : ''}</p>
                        </div>
                    </div>

                    {/* Audio Element (Hidden) */}
                    <audio
                        ref={audioRef}
                        src={currentSong ? currentSong.src : ''}
                        onEnded={handleSongEnded}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        preload="auto"
                    ></audio>

                    {/* Player Controls */}
                    <div className="bg-zinc-800 rounded-lg p-4 shadow-inner flex flex-col items-center flex-shrink-0">
                        {/* Progress Bar */}
                        <div className="w-full flex items-center mb-2">
                            <span className="text-sm text-gray-400 mr-2">{formatTime(currentTime)}</span>
                            <input
                                type="range"
                                min="0"
                                max={duration || 0}
                                value={currentTime}
                                onChange={handleSeek}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                            />
                            <span className="text-sm text-gray-400 ml-2">{formatTime(duration)}</span>
                        </div>

                        {/* Control Buttons */}
                        <div className="flex items-center justify-center space-x-3 mb-2">
                            <button
                                onClick={handleShuffle}
                                className={`p-2 rounded-full transition-all duration-300 ${isShuffling ? 'text-green-500' : 'text-gray-400 hover:text-white'}`}
                                title="Shuffle"
                            >
                                <Shuffle size={20} />
                            </button>
                            <button
                                onClick={handlePrev}
                                className="p-2 rounded-full text-gray-400 hover:text-white transition-all duration-300"
                                title="Previous"
                            >
                                <SkipBack size={20} />
                            </button>
                            <button
                                onClick={handlePlayPause}
                                className="p-3 rounded-full bg-green-500 text-black shadow-xl hover:scale-105 transition-all duration-300"
                                title={isPlaying ? "Pause" : "Play"}
                            >
                                {isPlaying ? <Pause size={28} /> : <Play size={28} />}
                            </button>
                            <button
                                onClick={handleNext}
                                className="p-2 rounded-full text-gray-400 hover:text-white transition-all duration-300"
                                title="Next"
                            >
                                <SkipForward size={20} />
                            </button>
                            <button
                                onClick={handleRepeat}
                                className={`p-2 rounded-full transition-all duration-300 ${repeatMode !== 'off' ? 'text-green-500' : 'text-gray-400 hover:text-white'}`}
                                title={`Repeat: ${repeatMode}`}
                            >
                                <Repeat size={20} />
                                {repeatMode === 'one' && <span className="absolute -bottom-1 -right-1 text-xs font-bold">1</span>}
                            </button>
                        </div>

                        {/* Volume Control */}
                        <div className="flex items-center w-full max-w-xs mt-2">
                            <button onClick={toggleMute} className="p-1 text-gray-400 hover:text-white transition-colors duration-200" title={volume === 0 ? "Unmute" : "Mute"}>
                                {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={volume}
                                onChange={handleVolumeChange}
                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500 mx-2"
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* AddSongsToPlaylistModal (for multi-select to specific playlist) */}
            <AddSongsToPlaylistModal
                show={showAddSongsToPlaylistModal}
                onClose={() => setShowAddSongsToPlaylistModal(false)}
                availableSongs={defaultAvailableSongs}
                currentSongsInPlaylist={selectedFirebasePlaylistSongs}
                onAddSongs={handleAddSelectedSongsToPlaylist}
            />

            {/* SelectPlaylistForSongModal (for adding a single song from available songs) */}
            <SelectPlaylistForSongModal
                show={showSelectPlaylistForSongModal}
                onClose={() => setShowSelectPlaylistForSongModal(false)}
                playlists={userPlaylists}
                songToAdd={songToAddToSpecificPlaylist}
                onAddSingleSongToPlaylist={handleAddSingleSongToPlaylist}
            />
        </div>
    );
};

export default App;
