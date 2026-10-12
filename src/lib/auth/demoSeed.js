/* FAKE test students for the DEMO provider only, so you can try the login without a database.
   They behave exactly like real students will: log in with roll number + the first password, then you are
   forced to choose your own password.

   IMPORTANT: this repo is PUBLIC. Never put real roll numbers or real passwords in this file.
   Real accounts belong in the backend database, created by the roster tool (docs/AUTH.md, "Creating the student accounts"). */
export const DEMO_SEED = [
  { rollNo: "DEMO0001", name: "Demo Student One", email: "", initialPassword: "Welcome-7421" },
  { rollNo: "DEMO0002", name: "Demo Student Two", email: "", initialPassword: "Welcome-5586" },
];
