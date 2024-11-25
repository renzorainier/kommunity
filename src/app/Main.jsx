'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/app/firebase/config';
import { useRouter } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import success from './success.wav';
import CreatePost from './CreatePost';
import Profile from './Profile';
import Feed from './Feed';
import Navbar from './Navbar'; // Import Navbar

export default function Main() {
  const [user, loading, error] = useAuthState(auth);
  const [userData, setUserData] = useState(null);
  const [postData, setPostData] = useState(null);
  const [activeComponent, setActiveComponent] = useState('feed'); // Default to 'feed'
  const router = useRouter();

  const handleUserCheck = useCallback(() => {
    if (!user) {
      router.push('/sign-in');
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setUserData(data);
        console.log('User data from Firestore:', data);

        const audio = new Audio(success);
        audio.play().catch((err) => console.error('Failed to play sound:', err));
      } else {
        console.error('No user data found');
        router.push('/error');
      }
    });

    const postDocRef = doc(db, 'posts', 'posts');
    const unsubscribePost = onSnapshot(postDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setPostData(data);
        console.log('Posts data:', data);
      } else {
        console.error('No posts data found');
      }
    });

    return () => {
      unsubscribeUser();
      unsubscribePost();
    };
  }, [user, router]);

  useEffect(() => {
    if (!loading && !error) {
      handleUserCheck();
    }
  }, [user, loading, error, handleUserCheck]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  const renderComponent = () => {
    switch (activeComponent) {
      case 'profile':
        return <Profile postData={postData} userData={userData} />;
      case 'createPost':
        return <CreatePost userData={userData} />;
      case 'feed':
      default:
        return <Feed postData={postData} userData={userData} />;
    }
  };

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <Navbar activeComponent={activeComponent} setActiveComponent={setActiveComponent} />

      {/* Active Component */}
      <section className="p-4">{renderComponent()}</section>
    </main>
  );
}




      {/* <Feed postData={postData} /> */}
