
'use server';

import { db } from './firebase';
import { collection, doc, getDocs, setDoc, updateDoc, query, where, writeBatch } from 'firebase/firestore';
import type { PincodeDistrict } from './types';
import { TAMIL_NADU_PINCODES } from './pincode-data';

const pincodesCollection = collection(db, 'pincodes');

export const getPincodeDistricts = async (): Promise<PincodeDistrict[]> => {
  try {
    const querySnapshot = await getDocs(pincodesCollection);
    
    if (querySnapshot.empty) {
        // If the collection is empty, seed it with initial data
        return await seedPincodeData();
    }

    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PincodeDistrict))
      .sort((a, b) => a.districtName.localeCompare(b.districtName));

  } catch (error) {
    console.error("Error getting pincode districts: ", error);
    throw new Error("Failed to fetch pincode districts.");
  }
};

export const getActivePincodeDistricts = async (): Promise<PincodeDistrict[]> => {
    try {
      const q = query(pincodesCollection, where("isActive", "==", true));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PincodeDistrict))
        .sort((a, b) => a.districtName.localeCompare(b.districtName));
  
    } catch (error) {
      console.error("Error getting active pincode districts: ", error);
      throw new Error("Failed to fetch active pincode districts.");
    }
  };

export const updatePincodeDistrictStatus = async (districtId: string, isActive: boolean): Promise<void> => {
    try {
        const districtDoc = doc(db, 'pincodes', districtId);
        await updateDoc(districtDoc, { isActive });
    } catch (error) {
        console.error("Error updating pincode district status: ", error);
        throw new Error("Failed to update district status.");
    }
}

// This function seeds the database with the initial pincode data.
export const seedPincodeData = async (): Promise<PincodeDistrict[]> => {
    const batch = writeBatch(db);
    
    TAMIL_NADU_PINCODES.forEach(districtData => {
      const docRef = doc(pincodesCollection); // Automatically generate a unique ID
      batch.set(docRef, { ...districtData, isActive: false }); // Default to inactive
    });
  
    try {
      await batch.commit();
      console.log("Pincode data seeded successfully.");
      // After seeding, fetch and return the data
      return await getPincodeDistricts();
    } catch (error) {
      console.error("Error seeding pincode data: ", error);
      throw new Error("Failed to seed pincode data.");
    }
};
