'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { ref, getDownloadURL, listAll } from 'firebase/storage';
import { db, storage } from '@/app/firebase/config'; // Firebase configuration
import { CgProfile } from 'react-icons/cg';
import Header from './Header'; // Import the Header component

export default function Search({ postData, currentUser }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [profileImages, setProfileImages] = useState({});
  const [postImages, setPostImages] = useState({});
  const [visiblePosts, setVisiblePosts] = useState(5);
  const [error, setError] = useState({});

  // Fetch all users and their profile images
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const snapshot = await getDocs(usersCollection);

        const usersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const filteredUsers = usersData.filter((user) => user.id !== currentUser?.id);
        setUsers(filteredUsers);
        setFilteredUsers(filteredUsers);

        const profileImagePromises = filteredUsers.map(async (user) => {
          const profileImageRef = ref(storage, `images/${user.id}/`);
          try {
            const response = await listAll(profileImageRef);
            if (response.items.length > 0) {
              const url = await getDownloadURL(response.items[0]);
              return { userId: user.id, url };
            }
          } catch {
            return { userId: user.id, url: null };
          }
        });

        const resolvedImages = await Promise.all(profileImagePromises);
        const profileImageMap = resolvedImages.reduce((acc, { userId, url }) => {
          if (url) acc[userId] = url;
          return acc;
        }, {});

        setProfileImages(profileImageMap);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [currentUser]);

  useEffect(() => {
    if (searchQuery === '') {
      setFilteredUsers(users);
    } else {
      const results = users.filter((user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(results);
    }
  }, [searchQuery, users]);

  const formatDate = (timestamp) => {
    if (!timestamp?.seconds) return '';
    const date = new Date(timestamp.seconds * 1000);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  const getUserPosts = () => {
    if (!postData || !selectedUser) return [];
    const userPosts = Object.entries(postData)
      .flatMap(([date, posts]) =>
        Object.entries(posts).map(([postId, postDetails]) => ({
          postId,
          ...postDetails,
        }))
      )
      .filter((post) => post.userID === selectedUser.id && post.date?.seconds)
      .sort((a, b) => b.date.seconds - a.date.seconds);
    return userPosts.slice(0, visiblePosts);
  };

  const fetchPostImages = async (posts) => {
    const postImagePromises = posts.map((post) => {
      if (post.postPicRef) {
        const postImageRef = ref(storage, `posts/${post.postPicRef}/`);
        return listAll(postImageRef)
          .then((response) => {
            if (response.items.length === 0) {
              setError((prev) => ({ ...prev, [post.postId]: true }));
              return { postId: post.postId, url: null };
            }
            return getDownloadURL(response.items[0]).then((url) => ({
              postId: post.postId,
              url,
            }));
          })
          .catch(() => {
            setError((prev) => ({ ...prev, [post.postId]: true }));
            return { postId: post.postId, url: null };
          });
      }
      return Promise.resolve({ postId: post.postId, url: null });
    });

    const resolvedPostImages = await Promise.all(postImagePromises);

    const postImageMap = resolvedPostImages.reduce((acc, { postId, url }) => {
      if (url) acc[postId] = url;
      return acc;
    }, {});

    setPostImages((prev) => ({ ...prev, ...postImageMap }));
  };

  useEffect(() => {
    const userPosts = getUserPosts();
    fetchPostImages(userPosts);
  }, [selectedUser, visiblePosts]);

  if (!selectedUser) {
    return (
      <div className="p-6 bg-[#F8FAFB] min-h-screen">
        {/* Search Input */}
        <div className="relative mb-4">
          <div className="flex items-center justify-end">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-[85%] max-w-md p-3 bg-[#E0EAF6] text-gray-500 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-[#B7CCE5] shadow-sm"
            />
          </div>
        </div>
        <hr className="my-4 border-gray-300" />

        {/* Recent Users */}
        <h2 className="text-lg font-bold text-gray-800 mb-4">Recent</h2>
        <ul className="flex space-x-4 overflow-x-auto">
          {filteredUsers.map((user) => (
            <li
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className="flex flex-col items-center cursor-pointer"
            >
              <div className="relative">
                {profileImages[user.id] ? (
                  <img
                    src={profileImages[user.id]}
                    alt={`${user.name}'s profile`}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-300 shadow-sm"
                  />
                ) : (
                  <CgProfile size={64} className="text-gray-400 mx-auto" />
                )}
              </div>
              <span className="block text-center mt-2 text-sm text-gray-700">{user.name}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const userPosts = getUserPosts();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <button
        onClick={() => setSelectedUser(null)}
        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg shadow-md hover:bg-gray-400 transition mb-6"
      >
        Back
      </button>
      <Header userData={selectedUser} /> {/* Pass selectedUser as userData to the Header component */}
   
      <div className="space-y-6">
        {userPosts.map((post) => (
          <div key={post.postId} className="bg-white p-6 rounded-lg shadow-md">
            {/* Post Content */}
            <div className="flex items-center space-x-4 mb-4">
              {profileImages[selectedUser.id] ? (
                <img
                  src={profileImages[selectedUser.id]}
                  alt={`${selectedUser.name}'s profile`}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 shadow-md"
                />
              ) : (
                <CgProfile size={48} className="text-gray-400" />
              )}
              <div>
                <p className="text-lg text-[#496992] font-bold">{selectedUser.name}</p>
                <p className="text-sm text-gray-500">{formatDate(post.date)}</p>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {post.category && (
                <span className="bg-[#5856D6] text-white font-bold py-1 px-3 rounded-full">
                  {post.category}
                </span>
              )}
              <span
                className={`py-1 px-3 rounded-full ${
                  post.isAvailable
                    ? 'bg-[#b3bbc5] text-white font-bold shadow-md'
                    : 'bg-[#34c759] text-white font-bold shadow-md'
                }`}
              >
                {post.isAvailable ? 'Available' : 'Completed'}
              </span>
              <span
                className={`py-1 px-3 rounded-full ${
                  post.isVolunteer
                    ? 'bg-[#FBBC2E] text-black font-bold'
                    : 'bg-[#34c759] text-white font-bold'
                }`}
              >
                {post.isVolunteer ? 'Volunteer' : 'Loan'}
              </span>
            </div>

            <p className="text-lg text-gray-700 mt-2">{post.description}</p>

            {postImages[post.postId] && (
              <div className="mt-4">
                <img
                  src={postImages[post.postId]}
                  alt={`Post image for ${post.postId}`}
                  className="w-full h-60 object-cover rounded-lg shadow-md"
                />
              </div>
            )}
          </div>
        ))}
      </div>
      {userPosts.length > visiblePosts && (
        <button
          onClick={() => setVisiblePosts(visiblePosts + 5)}
          className="w-full py-3 bg-[#34c759] text-white rounded-lg shadow-md hover:bg-[#28a745] transition"
        >
          Load More
        </button>
      )}
    </div>
  );
}
