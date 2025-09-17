import { auth, db } from "../firebase";
import Header from "@/components/Header";
import {
  GoogleAuthProvider,
  signInWithCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";