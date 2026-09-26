// import { useState, useEffect } from 'react';
// import { useParams, useLocation, useNavigate } from 'react-router-dom';
// import { AppShell } from '../components/layout/AppShell';
// import { apiClient } from '../api/client';
// import { useAuthStore } from '../store/authStore';
// import styles from './BookingPage.module.css';
//
// // Enum mappings
// const PASSENGER_TYPE = {
//   Adult: 0,
//   Kid: 1,
//   Baby: 2,
//   None: 3,
// };
//
// const PASSENGER_TYPE_NAMES = {
//   0: 'Adult',
//   1: 'Kid',
//   2: 'Baby',
//   3: 'None',
// };
//
// const DOCUMENT_TYPE = {
//   Passport: 0,
//   ForeignPassport: 1,
//   BirthCertificate: 2,
//   Other: 3,
// };
//
// const GENDER = {
//   Male: 0,
//   Female: 1,
// };
//
// const FLIGHT_STATUS = {
//   Scheduled: 0,
//   CheckIn: 1,
//   Boarding: 2,
//   Departed: 3,
//   Arrived: 4,
//   Cancelled: 5,
//   Delayed: 6,
// };
//
// function Step1PassengerDocuments({ flight, passengers, onNext, onBack }) {
//   const user = useAuthStore((state) => state.user);
//   const [passengerData, setPassengerData] = useState([]);
//   const [savedPassengers, setSavedPassengers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [creating, setCreating] = useState(false);
//
//   useEffect(() => {
//     async function loadPassengers() {
//       try {
//         const response = await apiClient.get('/passengers/me');
//         setSavedPassengers(Array.isArray(response.data) ? response.data : []);
//       } catch (err) {
//         console.error('Failed to load saved passengers:', err);
//       } finally {
//         setLoading(false);
//       }
//     }
//
//     loadPassengers();
//
//     // Initialize passenger data for each passenger
//     const totalPassengers = passengers.adults + passengers.kids + passengers.babies;
//     setPassengerData(
//       Array.from({ length: totalPassengers }, (_, i) => ({
//         index: i,
//         type: i < passengers.adults ? PASSENGER_TYPE.Adult : i < passengers.adults + passengers.kids ? PASSENGER_TYPE.Kid : PASSENGER_TYPE.Baby,
//         useExisting: false,
//         existingPassengerId: null,
//         documents: {
//           type: 'Passport',
//           gender: 'Male',
//           firstName: '',
//           middleName: '',
//           lastName: '',
//           number: '',
//           series: '',
//           dateOfBirth: '',
//           validityPeriod: '',
//         },
//       }))
//     );
//   }, [passengers]);
//
//   // Check if all passengers have required fields filled
//   const allFieldsFilled = passengerData.every((p) => {
//     if (p.useExisting && p.existingPassengerId) return true;
//     return (
//       p.documents.firstName &&
//       p.documents.lastName &&
//       p.documents.number &&
//       p.documents.dateOfBirth &&
//       p.documents.type &&
//       p.documents.gender
//     );
//   });
//
//   async function handleNext() {
//     setCreating(true);
//     setError('');
//
//     try {
//       const createdPassengers = [];
//
//       for (let i = 0; i < passengerData.length; i++) {
//         const pData = passengerData[i];
//         let passengerId;
//
//         if (pData.useExisting && pData.existingPassengerId) {
//           passengerId = pData.existingPassengerId;
//         } else {
//           const validationPayload = {
//             Type: DOCUMENT_TYPE[pData.documents.type] || 0,
//             FirstName: pData.documents.firstName,
//             MiddleName: pData.documents.middleName || null,
//             LastName: pData.documents.lastName,
//             Number: pData.documents.number,
//             Series: pData.documents.series || null,
//             Gender: GENDER[pData.documents.gender] || 0,
//             DateOfBirth: pData.documents.dateOfBirth,
//             ValidityPeriod: pData.documents.validityPeriod || null,
//             UserId: user.id,
//           };
//
//           try {
//             await apiClient.post('/documents/validate', validationPayload);
//           } catch (validationErr) {
//             throw new Error(
//               validationErr.response?.data?.message || validationErr.message
//             );
//           }
//
//           const passengerResp = await apiClient.post('/passengers', {
//             userId: user.id,
//             type: pData.type,
//             isSaved: true,
//           });
//           passengerId = passengerResp.data.id || passengerResp.data.Id;
//
//           await apiClient.post('/documents', {
//             passengerId: passengerId,
//             type: DOCUMENT_TYPE[pData.documents.type] || 0,
//             firstName: pData.documents.firstName,
//             middleName: pData.documents.middleName,
//             lastName: pData.documents.lastName,
//             gender: GENDER[pData.documents.gender] || 0,
//             dateOfBirth: pData.documents.dateOfBirth,
//             validityPeriod: pData.documents.validityPeriod || null,
//             number: pData.documents.number,
//             series: pData.documents.series || null,
//             userId: user.id,
//           });
//         }
//
//         createdPassengers.push({
//           ...pData,
//           savedPassengerId: passengerId,
//         });
//       }
//
//       onNext(createdPassengers);
//     } catch (err) {
//       setError(err.message || 'Failed to create passengers');
//     } finally {
//       setCreating(false);
//     }
//   }
//
//   return (
//     <div className={styles.stepContent}>
//       <h2>Step 1: Passenger Information</h2>
//       <p>Add or select passengers with their documents for this booking.</p>
//
//       {error && <div className={styles.error}>{error}</div>}
//
//       {loading ? (
//         <div className={styles.loading}>Loading saved passengers...</div>
//       ) : (
//         <div className={styles.passengersGrid}>
//           {passengerData.map((pData) => (
//             <div key={pData.index} className={styles.passengerCard}>
//               <div className={styles.passengerTitle}>
//                 Passenger {pData.index + 1} ({PASSENGER_TYPE_NAMES[pData.type]})
//               </div>
//
//               <div className={styles.toggleOption}>
//                 <label>
//                   <input
//                     type="checkbox"
//                     checked={pData.useExisting}
//                     onChange={(e) => {
//                       const updated = [...passengerData];
//                       updated[pData.index].useExisting = e.target.checked;
//                       setPassengerData(updated);
//                     }}
//                   />
//                   Use existing passenger
//                 </label>
//               </div>
//
//               {pData.useExisting && savedPassengers.length > 0 ? (
//                 <select
//                   value={pData.existingPassengerId || ''}
//                   onChange={(e) => {
//                     const updated = [...passengerData];
//                     updated[pData.index].existingPassengerId = e.target.value;
//                     setPassengerData(updated);
//                   }}
//                   className={styles.selectPassenger}
//                 >
//                   <option value="">Select saved passenger...</option>
//                   {savedPassengers.map((p) => {
//                     const id = p.id || p.Id;
//                     const doc = p.documents && p.documents.length > 0 ? p.documents[0] : null;
//                     const name = doc ? `${doc.firstName || doc.FirstName} ${doc.lastName || doc.LastName}` : `Passenger ${id}`;
//                     return (
//                       <option key={id} value={id}>
//                         {name}
//                       </option>
//                     );
//                   })}
//                 </select>
//               ) : (
//                 <div className={styles.documentForm}>
//                   <div className={styles.formRow}>
//                     <div className={styles.formGroup}>
//                       <label>Document Type</label>
//                       <select
//                         value={pData.documents.type}
//                         onChange={(e) => {
//                           const updated = [...passengerData];
//                           updated[pData.index].documents.type = e.target.value;
//                           setPassengerData(updated);
//                         }}
//                       >
//                         <option value="Passport">Passport</option>
//                         <option value="ForeignPassport">Foreign Passport</option>
//                         <option value="BirthCertificate">Birth Certificate</option>
//                         <option value="Other">Other</option>
//                       </select>
//                     </div>
//                     <div className={styles.formGroup}>
//                       <label>Gender</label>
//                       <select
//                         value={pData.documents.gender}
//                         onChange={(e) => {
//                           const updated = [...passengerData];
//                           updated[pData.index].documents.gender = e.target.value;
//                           setPassengerData(updated);
//                         }}
//                       >
//                         <option value="Male">Male</option>
//                         <option value="Female">Female</option>
//                       </select>
//                     </div>
//                   </div>
//
//                   <div className={styles.formRow}>
//                     <div className={styles.formGroup}>
//                       <label>First Name *</label>
//                       <input
//                         type="text"
//                         value={pData.documents.firstName}
//                         onChange={(e) => {
//                           const updated = [...passengerData];
//                           updated[pData.index].documents.firstName = e.target.value;
//                           setPassengerData(updated);
//                         }}
//                         placeholder="First name"
//                       />
//                     </div>
//                     <div className={styles.formGroup}>
//                       <label>Middle Name</label>
//                       <input
//                         type="text"
//                         value={pData.documents.middleName}
//                         onChange={(e) => {
//                           const updated = [...passengerData];
//                           updated[pData.index].documents.middleName = e.target.value;
//                           setPassengerData(updated);
//                         }}
//                         placeholder="Middle name (optional)"
//                       />
//                     </div>
//                     <div className={styles.formGroup}>
//                       <label>Last Name *</label>
//                       <input
//                         type="text"
//                         value={pData.documents.lastName}
//                         onChange={(e) => {
//                           const updated = [...passengerData];
//                           updated[pData.index].documents.lastName = e.target.value;
//                           setPassengerData(updated);
//                         }}
//                         placeholder="Last name"
//                       />
//                     </div>
//                   </div>
//
//                   <div className={styles.formRow}>
//                     <div className={styles.formGroup}>
//                       <label>Document Number *</label>
//                       <input
//                         type="text"
//                         value={pData.documents.number}
//                         onChange={(e) => {
//                           const updated = [...passengerData];
//                           updated[pData.index].documents.number = e.target.value;
//                           setPassengerData(updated);
//                         }}
//                         placeholder="Document number"
//                       />
//                     </div>
//                     <div className={styles.formGroup}>
//                       <label>Series (optional)</label>
//                       <input
//                         type="text"
//                         value={pData.documents.series}
//                         onChange={(e) => {
//                           const updated = [...passengerData];
//                           updated[pData.index].documents.series = e.target.value;
//                           console.log(updated[pData.index].documents.series);
//                           setPassengerData(updated);
//                         }}
//                         placeholder="Series"
//                       />
//                     </div>
//                   </div>
//
//                   <div className={styles.formRow}>
//                     <div className={styles.formGroup}>
//                       <label>Date of Birth *</label>
//                       <input
//                         type="date"
//                         value={pData.documents.dateOfBirth}
//                         onChange={(e) => {
//                           const updated = [...passengerData];
//                           updated[pData.index].documents.dateOfBirth = e.target.value;
//                           setPassengerData(updated);
//                         }}
//                       />
//                     </div>
//                     <div className={styles.formGroup}>
//                       <label>Validity Period (optional)</label>
//                       <input
//                         type="date"
//                         value={pData.documents.validityPeriod}
//                         onChange={(e) => {
//                           const updated = [...passengerData];
//                           updated[pData.index].documents.validityPeriod = e.target.value;
//                           setPassengerData(updated);
//                         }}
//                       />
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       )}
//
//       <div className={styles.buttonRow}>
//         <button className={styles.backBtn} onClick={onBack}>
//           Back
//         </button>
//         <button className={styles.nextBtn} onClick={handleNext} disabled={!allFieldsFilled || creating}>
//           {creating ? 'Creating...' : 'Next: Select Seats'}
//         </button>
//       </div>
//     </div>
//   );
// }
//
// function Step2SeatSelection({ flight, passengerData, onNext, onBack }) {
//    const [selectedSeats, setSelectedSeats] = useState({});
//   const [seatTypes, setSeatTypes] = useState({}); // Track business/economy for each passenger
//    const bookedSeats = flight.bookings || [];
//
//    useEffect(() => {
//      // Initialize selected seats
//      const seats = {};
//      const types = {};
//      passengerData.forEach((p, i) => {
//        seats[i] = null;
//        types[i] = 'economy'; // Default to economy
//      });
//      setSelectedSeats(seats);
//      setSeatTypes(types);
//    }, [passengerData]);
//
//   // Generate seat map and logic
//   const generateSeatMap = () => {
//     const airplane = flight.airplane;
//     const seats = [];
//
//     // Business class seats (rows 1 to buisnessRows)
//     // Config: 2-2 (A, C | D, F)
//     for (let row = 1; row <= airplane.buisnessRows; row++) {
//       const rowData = {};
//       const letters = ['A', 'C', 'D', 'F'];
//
//       for (const letter of letters) {
//         const seatNumber = `${row}${letter}`;
//         rowData[letter] = {
//           number: seatNumber,
//           isBooked: bookedSeats.includes(seatNumber),
//           isBusiness: true,
//         };
//       }
//
//       seats.push({
//         type: 'business',
//         row: row,
//         seats: rowData,
//         letters: letters,
//       });
//     }
//
//     // Economy class seats (rows 5 to 28)
//     // Config: 3-3 (A, B, C | D, E, F)
//     const economyStartRow = airplane.buisnessRows + 1;
//     let economyRowCount = 0;
//
//     for (let row = economyStartRow; row < economyStartRow + airplane.rows; row++) {
//       // Add spacer AFTER row 12 (which is the 7th economy row, at index 7)
//       if (economyRowCount === 7) {
//         seats.push({ type: 'spacer' });
//       }
//
//       const rowData = {};
//       const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
//
//       for (const letter of letters) {
//         const seatNumber = `${row}${letter}`;
//         rowData[letter] = {
//           number: seatNumber,
//           isBooked: bookedSeats.includes(seatNumber),
//           isBusiness: false,
//         };
//       }
//
//       seats.push({
//         type: 'economy',
//         row: row,
//         seats: rowData,
//         letters: letters,
//       });
//
//       economyRowCount++;
//     }
//
//     return seats;
//   };
//
//   const seatMap = generateSeatMap();
//
//   function getButtonClassName(isBusiness, isBooked, isSelected) {
//     let classes = [styles.seat];
//     if (isBusiness) classes.push(styles.seatBusiness);
//     if (isBooked) classes.push(styles.seatBooked);
//     if (isSelected) classes.push(styles.seatSelected);
//     return classes.join(' ');
//   }
//
//    function handleSeatClick(seatNumber, passengerIndex, isBusiness = false) {
//      if (selectedSeats[passengerIndex] === seatNumber) {
//        // Toggle: deselect if clicking same seat
//        setSelectedSeats((prev) => ({
//          ...prev,
//          [passengerIndex]: null,
//        }));
//        setSeatTypes((prev) => ({
//          ...prev,
//          [passengerIndex]: 'economy',
//        }));
//      } else {
//        setSelectedSeats((prev) => ({
//          ...prev,
//          [passengerIndex]: seatNumber,
//        }));
//        setSeatTypes((prev) => ({
//          ...prev,
//          [passengerIndex]: isBusiness ? 'business' : 'economy',
//        }));
//      }
//    }
//
//   function findPassengerForSeat(seatNumber) {
//     for (const [index, seat] of Object.entries(selectedSeats)) {
//       if (seat === seatNumber) return parseInt(index);
//     }
//     return null;
//   }
//
//   const allSeatsSelected = Object.values(selectedSeats).every((s) => s !== null);
//
//   return (
//     <div className={styles.stepContent}>
//       <h2>Step 2: Select Seats</h2>
//       <p>Click on a seat to select it for a passenger. Click again to deselect.</p>
//
//       <div className={styles.seatSelectionContainer}>
//         <div className={styles.seatSelectionLeft}>
//           <div className={styles.seatMap}>
//             <div className={styles.seatTitle}>Airplane Seating Chart</div>
//             <div className={styles.seatMapContent}>
//               {seatMap.map((row, rowIndex) => {
//                 if (row.type === 'spacer') {
//                   return <div key="spacer" className={styles.spacPlus}></div>;
//                 }
//
//                 const isBusiness = row.type === 'business';
//
//                 return (
//                   <div key={rowIndex} className={styles.seatRowWrapper}>
//                     <div className={styles.rowNumber}>{row.row}</div>
//
//                     {/* Left seats (A, C for business | A, B, C for economy) */}
//                     <div className={styles.seatsLeftGroup}>
//                       {isBusiness ? (
//                         <>
//                            <button
//                              className={`${styles.seat} ${styles.seatBusiness} ${row.seats.A.isBooked ? styles.seatBooked : ''} ${
//                                Object.values(selectedSeats).includes(row.seats.A.number) ? styles.seatSelected : ''
//                              }`}
//                              onClick={() => {
//                                if (!row.seats.A.isBooked) {
//                                  const passengerIdx = Object.entries(selectedSeats).find(([_, s]) => s === row.seats.A.number)?.[0];
//                                  if (passengerIdx !== undefined) {
//                                    handleSeatClick(row.seats.A.number, parseInt(passengerIdx), isBusiness);
//                                  } else {
//                                    const unassigned = passengerData.findIndex((_, i) => !selectedSeats[i] || selectedSeats[i] === null);
//                                    if (unassigned >= 0) handleSeatClick(row.seats.A.number, unassigned, isBusiness);
//                                  }
//                                }
//                              }}
//                              disabled={row.seats.A.isBooked}
//                              title={row.seats.A.number}
//                            >
//                              {row.seats.A.number}
//                            </button>
//                            <button
//                              className={`${styles.seat} ${styles.seatBusiness} ${row.seats.C.isBooked ? styles.seatBooked : ''} ${
//                                Object.values(selectedSeats).includes(row.seats.C.number) ? styles.seatSelected : ''
//                              }`}
//                              onClick={() => {
//                                if (!row.seats.C.isBooked) {
//                                  const passengerIdx = Object.entries(selectedSeats).find(([_, s]) => s === row.seats.C.number)?.[0];
//                                  if (passengerIdx !== undefined) {
//                                    handleSeatClick(row.seats.C.number, parseInt(passengerIdx), isBusiness);
//                                  } else {
//                                    const unassigned = passengerData.findIndex((_, i) => !selectedSeats[i] || selectedSeats[i] === null);
//                                    if (unassigned >= 0) handleSeatClick(row.seats.C.number, unassigned, isBusiness);
//                                  }
//                                }
//                              }}
//                              disabled={row.seats.C.isBooked}
//                              title={row.seats.C.number}
//                            >
//                              {row.seats.C.number}
//                            </button>
//                          </>
//                        ) : (
//                         <>
//                           <button
//                             className={`${styles.seat} ${row.seats.A.isBooked ? styles.seatBooked : ''} ${
//                               Object.values(selectedSeats).includes(row.seats.A.number) ? styles.seatSelected : ''
//                             }`}
//                              onClick={() => {
//                                if (!row.seats.A.isBooked) {
//                                  const passengerIdx = Object.entries(selectedSeats).find(([_, s]) => s === row.seats.A.number)?.[0];
//                                  if (passengerIdx !== undefined) {
//                                    handleSeatClick(row.seats.A.number, parseInt(passengerIdx), false);
//                                  } else {
//                                    const unassigned = passengerData.findIndex((_, i) => !selectedSeats[i] || selectedSeats[i] === null);
//                                    if (unassigned >= 0) handleSeatClick(row.seats.A.number, unassigned, false);
//                                  }
//                                }
//                              }}
//                             disabled={row.seats.A.isBooked}
//                             title={row.seats.A.number}
//                           >
//                             {row.seats.A.number}
//                           </button>
//                           <button
//                             className={`${styles.seat} ${row.seats.B.isBooked ? styles.seatBooked : ''} ${
//                               Object.values(selectedSeats).includes(row.seats.B.number) ? styles.seatSelected : ''
//                             }`}
//                              onClick={() => {
//                                if (!row.seats.B.isBooked) {
//                                  const passengerIdx = Object.entries(selectedSeats).find(([_, s]) => s === row.seats.B.number)?.[0];
//                                  if (passengerIdx !== undefined) {
//                                    handleSeatClick(row.seats.B.number, parseInt(passengerIdx), false);
//                                  } else {
//                                    const unassigned = passengerData.findIndex((_, i) => !selectedSeats[i] || selectedSeats[i] === null);
//                                    if (unassigned >= 0) handleSeatClick(row.seats.B.number, unassigned, false);
//                                  }
//                                }
//                              }}
//                             disabled={row.seats.B.isBooked}
//                             title={row.seats.B.number}
//                           >
//                             {row.seats.B.number}
//                           </button>
//                           <button
//                             className={`${styles.seat} ${row.seats.C.isBooked ? styles.seatBooked : ''} ${
//                               Object.values(selectedSeats).includes(row.seats.C.number) ? styles.seatSelected : ''
//                             }`}
//                             onClick={() => {
//                               if (!row.seats.C.isBooked) {
//                                 const passengerIdx = Object.entries(selectedSeats).find(([_, s]) => s === row.seats.C.number)?.[0];
//                                 if (passengerIdx !== undefined) {
//                                   handleSeatClick(row.seats.C.number, parseInt(passengerIdx));
//                                 } else {
//                                   const unassigned = passengerData.findIndex((_, i) => !selectedSeats[i] || selectedSeats[i] === null);
//                                   if (unassigned >= 0) handleSeatClick(row.seats.C.number, unassigned);
//                                 }
//                               }
//                             }}
//                             disabled={row.seats.C.isBooked}
//                             title={row.seats.C.number}
//                           >
//                             {row.seats.C.number}
//                           </button>
//                         </>
//                       )}
//                     </div>
//
//                     {/* Aisle */}
//                     <div className={styles.aisle}></div>
//
//                     {/* Right seats (D, F for business | D, E, F for economy) */}
//                     <div className={styles.seatsRightGroup}>
//                        {isBusiness ? (
//                          <>
//                            <button
//                              className={`${styles.seat} ${styles.seatBusiness} ${row.seats.D.isBooked ? styles.seatBooked : ''} ${
//                                Object.values(selectedSeats).includes(row.seats.D.number) ? styles.seatSelected : ''
//                              }`}
//                             onClick={() => {
//                               if (!row.seats.D.isBooked) {
//                                 const passengerIdx = Object.entries(selectedSeats).find(([_, s]) => s === row.seats.D.number)?.[0];
//                                 if (passengerIdx !== undefined) {
//                                   handleSeatClick(row.seats.D.number, parseInt(passengerIdx));
//                                 } else {
//                                   const unassigned = passengerData.findIndex((_, i) => !selectedSeats[i] || selectedSeats[i] === null);
//                                   if (unassigned >= 0) handleSeatClick(row.seats.D.number, unassigned);
//                                 }
//                               }
//                             }}
//                              disabled={row.seats.D.isBooked}
//                              title={row.seats.D.number}
//                            >
//                              {row.seats.D.number}
//                            </button>
//                            <button
//                              className={`${styles.seat} ${styles.seatBusiness} ${row.seats.F.isBooked ? styles.seatBooked : ''} ${
//                                Object.values(selectedSeats).includes(row.seats.F.number) ? styles.seatSelected : ''
//                              }`}
//                              onClick={() => {
//                                if (!row.seats.F.isBooked) {
//                                  const passengerIdx = Object.entries(selectedSeats).find(([_, s]) => s === row.seats.F.number)?.[0];
//                                  if (passengerIdx !== undefined) {
//                                    handleSeatClick(row.seats.F.number, parseInt(passengerIdx));
//                                  } else {
//                                    const unassigned = passengerData.findIndex((_, i) => !selectedSeats[i] || selectedSeats[i] === null);
//                                    if (unassigned >= 0) handleSeatClick(row.seats.F.number, unassigned, false);
//                                  }
//                                }
//                              }}
//                              disabled={row.seats.F.isBooked}
//                              title={row.seats.F.number}
//                            >
//                              {row.seats.F.number}
//                            </button>
//                          </>
//                        ) : (
//                         <>
//                           <button
//                             className={`${styles.seat} ${row.seats.D.isBooked ? styles.seatBooked : ''} ${
//                               Object.values(selectedSeats).includes(row.seats.D.number) ? styles.seatSelected : ''
//                             }`}
//                              onClick={() => {
//                                if (!row.seats.D.isBooked) {
//                                  const passengerIdx = Object.entries(selectedSeats).find(([_, s]) => s === row.seats.D.number)?.[0];
//                                  if (passengerIdx !== undefined) {
//                                    handleSeatClick(row.seats.D.number, parseInt(passengerIdx), false);
//                                  } else {
//                                    const unassigned = passengerData.findIndex((_, i) => !selectedSeats[i] || selectedSeats[i] === null);
//                                    if (unassigned >= 0) handleSeatClick(row.seats.D.number, unassigned, false);
//                                  }
//                                }
//                              }}
//                              disabled={row.seats.D.isBooked}
//                              title={row.seats.D.number}
//                            >
//                              {row.seats.D.number}
//                            </button>
//                            <button
//                              className={`${styles.seat} ${row.seats.E.isBooked ? styles.seatBooked : ''} ${
//                                Object.values(selectedSeats).includes(row.seats.E.number) ? styles.seatSelected : ''
//                              }`}
//                              onClick={() => {
//                                if (!row.seats.E.isBooked) {
//                                  const passengerIdx = Object.entries(selectedSeats).find(([_, s]) => s === row.seats.E.number)?.[0];
//                                  if (passengerIdx !== undefined) {
//                                    handleSeatClick(row.seats.E.number, parseInt(passengerIdx), false);
//                                  } else {
//                                    const unassigned = passengerData.findIndex((_, i) => !selectedSeats[i] || selectedSeats[i] === null);
//                                    if (unassigned >= 0) handleSeatClick(row.seats.E.number, unassigned, false);
//                                  }
//                                }
//                              }}
//                              disabled={row.seats.E.isBooked}
//                              title={row.seats.E.number}
//                            >
//                              {row.seats.E.number}
//                            </button>
//                            <button
//                              className={`${styles.seat} ${row.seats.F.isBooked ? styles.seatBooked : ''} ${
//                                Object.values(selectedSeats).includes(row.seats.F.number) ? styles.seatSelected : ''
//                              }`}
//                              onClick={() => {
//                                if (!row.seats.F.isBooked) {
//                                  const passengerIdx = Object.entries(selectedSeats).find(([_, s]) => s === row.seats.F.number)?.[0];
//                                  if (passengerIdx !== undefined) {
//                                    handleSeatClick(row.seats.F.number, parseInt(passengerIdx), false);
//                                 } else {
//                                   const unassigned = passengerData.findIndex((_, i) => !selectedSeats[i] || selectedSeats[i] === null);
//                                   if (unassigned >= 0) handleSeatClick(row.seats.F.number, unassigned);
//                                 }
//                               }
//                             }}
//                             disabled={row.seats.F.isBooked}
//                             title={row.seats.F.number}
//                           >
//                             {row.seats.F.number}
//                           </button>
//                         </>
//                       )}
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         </div>
//
//         <div className={styles.passengerSeatAssignment}>
//           <h3>Seat Assignment</h3>
//            {passengerData.map((p, i) => {
//              // Support multiple field naming conventions
//              const firstName = p.documents?.firstName || p.documents?.FirstName || '';
//              const lastName = p.documents?.lastName || p.documents?.LastName || '';
//              const passengerName = firstName
//                ? `${firstName} ${lastName}`.trim()
//                : `Passenger ${i + 1}`;
//              return (
//               <div key={i} className={styles.passengerSeatRow}>
//                 <div className={styles.passengerLabel}>
//                   <svg className={styles.passengerNameIcon} viewBox="0 0 24 24" fill="currentColor">
//                     <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
//                   </svg>
//                   <span>{passengerName}</span>
//                 </div>
//                 <div className={`${styles.seatDisplay} ${selectedSeats[i] ? styles.seatDisplayAssigned : ''}`}>
//                   {selectedSeats[i] || 'Not assigned'}
//                 </div>
//                 {selectedSeats[i] && (
//                   <button
//                     className={styles.clearSeatBtn}
//                     onClick={() => handleSeatClick(selectedSeats[i], i)}
//                     title="Click to deselect"
//                   >
//                     ✕
//                   </button>
//                 )}
//               </div>
//             );
//           })}
//         </div>
//       </div>
//
//         <div className={styles.buttonRow}>
//           <button className={styles.backBtn} onClick={onBack}>
//             Back
//           </button>
//           <button className={styles.nextBtn} onClick={() => onNext({ seats: selectedSeats, seatTypes: seatTypes })} disabled={!allSeatsSelected}>
//             Next: Review
//           </button>
//         </div>
//     </div>
//   );
// }
//
// function Step3Review({ flight, passengers, passengerData, selectedSeats, onNext, onBack, services, onServicesChange }) {
//    const [loading, setLoading] = useState(false);
//    const [error, setError] = useState('');
//    const [localServices, setLocalServices] = useState(services || passengerData.map(() => ({ hasLuggage: false, hasFood: false })));
//
//    useEffect(() => {
//      onServicesChange(localServices);
//    }, [localServices]);
//
//      const calculateTotal = () => {
//        let total = 0;
//        const seatTypes = selectedSeats.seatTypes || {};
//        const seats = selectedSeats.seats || selectedSeats;
//
//        passengerData.forEach((p, i) => {
//          const isBusiness = seatTypes[i] === 'business';
//          // Support multiple field naming conventions
//          const businessPrice = flight?.businessPrice || flight?.BusinessPrice || flight?.premiumPrice || flight?.PremiumPrice || 0;
//          const economyPrice = flight?.flightPrice || flight?.FlightPrice || flight?.economyPrice || flight?.EconomyPrice || 0;
//          const basePrice = isBusiness ? (businessPrice || economyPrice || 0) : (economyPrice || 0);
//          total += basePrice;
//
//          if (localServices[i].hasLuggage) total += flight?.luggagePrice || flight?.LuggagePrice || 0;
//          if (localServices[i].hasFood) total += flight?.foodPrice || flight?.FoodPrice || 0;
//        });
//        return total;
//      };
//
//    return (
//      <div className={styles.stepContent}>
//        <h2>Step 3: Review Your Booking</h2>
//        <p>Review your booking and add optional services.</p>
//
//        {error && <div className={styles.error}>{error}</div>}
//
//        <div className={styles.reviewSummary}>
//          <div className={styles.reviewSection}>
//            <h3>Flight Details</h3>
//            <div className={styles.reviewRow}>
//              <span>Route:</span>
//              <span>{flight?.fromAirport?.city || 'N/A'} → {flight?.toAirport?.city || 'N/A'}</span>
//            </div>
//            <div className={styles.reviewRow}>
//              <span>Departure:</span>
//              <span>
//                {flight?.departureTime
//                  ? new Date(flight.departureTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
//                  : 'N/A'}
//              </span>
//            </div>
//          </div>
//
//            <div className={styles.reviewSection}>
//              <h3>Passengers & Services</h3>
//              {passengerData.map((p, i) => {
//                // Support multiple field naming conventions
//                const firstName = p.documents?.firstName || p.documents?.FirstName || '';
//                const lastName = p.documents?.lastName || p.documents?.LastName || '';
//                const passengerName = firstName
//                  ? `${firstName} ${lastName}`.trim()
//                  : `Passenger ${i + 1}`;
//                const seatTypes = selectedSeats.seatTypes || {};
//                const seats = selectedSeats.seats || selectedSeats;
//                const isBusiness = seatTypes[i] === 'business';
//                const businessPrice = flight?.businessPrice || flight?.BusinessPrice || flight?.premiumPrice || flight?.PremiumPrice || 0;
//                const economyPrice = flight?.flightPrice || flight?.FlightPrice || flight?.economyPrice || flight?.EconomyPrice || 0;
//                const basePrice = isBusiness ? (businessPrice || economyPrice || 0) : (economyPrice || 0);
//                return (
//                  <div key={i} className={styles.passengerReviewCard}>
//                    <div className={styles.passengerReviewHeader}>
//                      <div>
//                        <strong>{passengerName}</strong>
//                        <small>Место: {seats[i]} {isBusiness ? '(Бизнес)' : ''}</small>
//                      </div>
//                      <div className={styles.passengerPrice}>
//                        ${basePrice.toFixed(2)}
//                      </div>
//                    </div>
//                  <div className={styles.serviceCheckboxes}>
//                    <label>
//                      <input
//                        type="checkbox"
//                        checked={localServices[i].hasLuggage}
//                        onChange={(e) => {
//                          const updated = [...localServices];
//                          updated[i].hasLuggage = e.target.checked;
//                          setLocalServices(updated);
//                        }}
//                      />
//                      Luggage +${(flight?.luggagePrice || flight?.LuggagePrice || 0).toFixed(2)}
//                    </label>
//                    <label>
//                      <input
//                        type="checkbox"
//                        checked={localServices[i].hasFood}
//                        onChange={(e) => {
//                          const updated = [...localServices];
//                          updated[i].hasFood = e.target.checked;
//                          setLocalServices(updated);
//                        }}
//                      />
//                      Food Service +${(flight?.foodPrice || flight?.FoodPrice || 0).toFixed(2)}
//                    </label>
//                  </div>
//                </div>
//              );
//            })}
//          </div>
//
//          <div className={styles.reviewTotal}>
//            <h3>Total Price: ${calculateTotal().toFixed(2)}</h3>
//          </div>
//        </div>
//
//        <div className={styles.buttonRow}>
//          <button className={styles.backBtn} onClick={onBack}>
//            Back
//          </button>
//          <button className={styles.nextBtn} onClick={() => onNext({ seats: selectedSeats, services: localServices })}>
//            Next
//          </button>
//        </div>
//      </div>
//    );
// }
//
// function FinalConfirmation({ outboundFlight, returnFlight, passengerData, outboundSeats, returnSeats, outboundServices, returnServices, onBack, navigate }) {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const user = useAuthStore((state) => state.user);
//
//   const calculateFlightTotal = (flight, seats, services, seatTypes) => {
//     let total = 0;
//     const seatList = seats.seats || seats;
//     const types = seatTypes || {};
//
//     passengerData.forEach((p, i) => {
//       const isBusiness = types[i] === 'business';
//       const businessPrice = flight?.businessPrice || flight?.BusinessPrice || flight?.premiumPrice || flight?.PremiumPrice || 0;
//       const economyPrice = flight?.flightPrice || flight?.FlightPrice || flight?.economyPrice || flight?.EconomyPrice || 0;
//       const basePrice = isBusiness ? (businessPrice || economyPrice || 0) : (economyPrice || 0);
//       total += basePrice;
//
//       if (services[i].hasLuggage) total += flight?.luggagePrice || flight?.LuggagePrice || 0;
//       if (services[i].hasFood) total += flight?.foodPrice || flight?.FoodPrice || 0;
//     });
//     return total;
//   };
//
//   async function handleFinalConfirm() {
//     setLoading(true);
//     setError('');
//
//     try {
//       // Prepare bookings for both flights
//       const outboundSeatTypes = outboundSeats.seatTypes || {};
//       const outboundSeatList = outboundSeats.seats || outboundSeats;
//       const returnSeatTypes = returnSeats.seatTypes || {};
//       const returnSeatList = returnSeats.seats || returnSeats;
//
//       const bookings = [];
//
//       // Add bookings for outbound flight
//       passengerData.forEach((p, i) => {
//         bookings.push({
//           PassengerId: p.savedPassengerId,
//           FlightId: outboundFlight.id || outboundFlight.Id,
//           SeatNumber: outboundSeatList[i],
//           HasLuggage: outboundServices[i].hasLuggage,
//           HasFood: outboundServices[i].hasFood,
//           IsBusiness: outboundSeatTypes[i] === 'business',
//         });
//       });
//
//       // Add bookings for return flight if it exists
//       if (returnFlight) {
//         passengerData.forEach((p, i) => {
//           bookings.push({
//             PassengerId: p.savedPassengerId,
//             FlightId: returnFlight.id || returnFlight.Id,
//             SeatNumber: returnSeatList[i],
//             HasLuggage: returnServices[i].hasLuggage,
//             HasFood: returnServices[i].hasFood,
//             IsBusiness: returnSeatTypes[i] === 'business',
//           });
//         });
//       }
//
//       // Create order with all bookings
//       const response = await apiClient.post('/orders', {
//         UserId: user.id,
//         Bookings: bookings,
//       });
//
//       const orderId = response.data?.id || response.data;
//       navigate(`/order-confirmation/${orderId}`);
//     } catch (err) {
//       setError(`Failed to create booking: ${err.response?.data?.message || err.message}`);
//       console.error('Booking error:', err);
//     } finally {
//       setLoading(false);
//     }
//   }
//
//   const outboundTotal = calculateFlightTotal(outboundFlight, outboundSeats, outboundServices, outboundSeats.seatTypes);
//   const returnTotal = returnFlight ? calculateFlightTotal(returnFlight, returnSeats, returnServices, returnSeats.seatTypes) : 0;
//
//   return (
//     <div className={styles.stepContent}>
//       <h2>Confirm Your Complete Booking</h2>
//       <p>Review all flight bookings and confirm your order.</p>
//
//       {error && <div className={styles.error}>{error}</div>}
//
//       <div className={styles.reviewSummary}>
//         <div className={styles.reviewSection}>
//           <h3>Outbound Flight</h3>
//           <div className={styles.reviewRow}>
//             <span>Route:</span>
//             <span>{outboundFlight?.fromAirport?.city || 'N/A'} → {outboundFlight?.toAirport?.city || 'N/A'}</span>
//           </div>
//           <div className={styles.reviewRow}>
//             <span>Flight Price:</span>
//             <span>${outboundTotal.toFixed(2)}</span>
//           </div>
//         </div>
//
//         {returnFlight && (
//           <div className={styles.reviewSection}>
//             <h3>Return Flight</h3>
//             <div className={styles.reviewRow}>
//               <span>Route:</span>
//               <span>{returnFlight?.fromAirport?.city || 'N/A'} → {returnFlight?.toAirport?.city || 'N/A'}</span>
//             </div>
//             <div className={styles.reviewRow}>
//               <span>Flight Price:</span>
//               <span>${returnTotal.toFixed(2)}</span>
//             </div>
//           </div>
//         )}
//
//         <div className={styles.reviewTotal}>
//           <h3>Total Order Price: ${(outboundTotal + returnTotal).toFixed(2)}</h3>
//         </div>
//       </div>
//
//       <div className={styles.buttonRow}>
//         <button className={styles.backBtn} onClick={onBack}>
//           Back
//         </button>
//         <button className={styles.confirmBtn} onClick={handleFinalConfirm} disabled={loading}>
//           {loading ? 'Processing...' : 'Confirm & Create Order'}
//         </button>
//       </div>
//     </div>
//   );
// }
//
// export function BookingPage() {
//   const { flightId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();
//   const user = useAuthStore((state) => state.user);
//
//    const [flight, setFlight] = useState(null);
//    const [returnFlight, setReturnFlight] = useState(location.state?.returnFlight || null);
//    const [passengers, setPassengers] = useState(location.state?.passengers || {});
//    const [step, setStep] = useState(0);
//    const [passengerData, setPassengerData] = useState([]);
//    const [selectedSeats, setSelectedSeats] = useState({});
//    const [loading, setLoading] = useState(true);
//    const [error, setError] = useState('');
//
//   useEffect(() => {
//     async function loadFlight() {
//       if (!flightId) {
//         setError('No flight selected');
//         return;
//       }
//
//       try {
//         const response = await apiClient.get(`/flights/${flightId}`);
//         const flightData = response.data;
//
//         const status = flightData.status;
//         if (status !== FLIGHT_STATUS.Scheduled && status !== FLIGHT_STATUS.CheckIn) {
//           setError('This flight is no longer available for booking.');
//           return;
//         }
//
//         setFlight(flightData);
//       } catch (err) {
//         setError('Failed to load flight details');
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     }
//
//     loadFlight();
//   }, [flightId]);
//
//   if (loading) {
//     return (
//       <AppShell title="Book Your Flight" subtitle="Complete your booking">
//         <div className={styles.container}>
//           <div className={styles.loading}>Loading flight details...</div>
//         </div>
//       </AppShell>
//     );
//   }
//
//   if (error || !flight) {
//     return (
//       <AppShell title="Book Your Flight" subtitle="Complete your booking">
//         <div className={styles.container}>
//           <div className={styles.error}>{error || 'Flight not found'}</div>
//           <button onClick={() => navigate(-1)} className={styles.backBtn}>
//             Go Back
//           </button>
//         </div>
//       </AppShell>
//     );
//   }
//
//   return (
//     <AppShell title="Book Your Flight" subtitle="Complete your booking">
//       <div className={styles.container}>
//         <div className={styles.stepsIndicator}>
//           <div className={`${styles.step} ${step === 0 ? styles.stepActive : step > 0 ? styles.stepComplete : ''}`}>
//             0. Flight Info
//           </div>
//           <div className={`${styles.step} ${step === 1 ? styles.stepActive : step > 1 ? styles.stepComplete : ''}`}>
//             1. Passengers
//           </div>
//           <div className={`${styles.step} ${step === 2 ? styles.stepActive : step > 2 ? styles.stepComplete : ''}`}>
//             2. Seats
//           </div>
//           <div className={`${styles.step} ${step === 3 ? styles.stepActive : step > 3 ? styles.stepComplete : ''}`}>
//             3. Review
//           </div>
//         </div>
//
//         {step === 0 && (
//           <div className={styles.stepContent}>
//             <h2>Flight Information</h2>
//             <p>Review the flight details and available services.</p>
//
//             <div className={styles.flightDetailsGrid}>
//               {/* Route Card */}
//               <div className={styles.detailCard}>
//                 <div className={styles.detailHeader}>
//                   <h3>Route</h3>
//                 </div>
//                 <div className={styles.routeDisplay}>
//                   <div className={styles.routePoint}>
//                     <div className={styles.routeCity}>{flight?.fromAirport?.city || 'N/A'}</div>
//                     <div className={styles.routeCode}>{flight?.fromAirport?.code || '---'}</div>
//                   </div>
//                   <div className={styles.routeArrow}>
//                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                       <path d="M5 12h14M12 5l7 7-7 7"/>
//                     </svg>
//                   </div>
//                   <div className={styles.routePoint}>
//                     <div className={styles.routeCity}>{flight?.toAirport?.city || 'N/A'}</div>
//                     <div className={styles.routeCode}>{flight?.toAirport?.code || '---'}</div>
//                   </div>
//                 </div>
//               </div>
//
//               {/* Times Card */}
//               <div className={styles.detailCard}>
//                 <div className={styles.detailHeader}>
//                   <h3>Departure & Arrival</h3>
//                 </div>
//                 <div className={styles.timesDisplay}>
//                   <div className={styles.timeBlock}>
//                     <span className={styles.timeLabel}>Depart</span>
//                     <span className={styles.timeValue}>
//                       {flight?.departureTime
//                         ? new Date(flight.departureTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
//                         : 'N/A'}
//                     </span>
//                     <span className={styles.dateValue}>
//                       {flight?.departureTime
//                         ? new Date(flight.departureTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
//                         : 'N/A'}
//                     </span>
//                   </div>
//                   <div className={styles.timeBlock}>
//                     <span className={styles.timeLabel}>Arrive</span>
//                     <span className={styles.timeValue}>
//                       {flight?.arrivalTime
//                         ? new Date(flight.arrivalTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
//                         : 'N/A'}
//                     </span>
//                     <span className={styles.dateValue}>
//                       {flight?.arrivalTime
//                         ? new Date(flight.arrivalTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
//                         : 'N/A'}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//
//               {/* Aircraft Card */}
//               <div className={styles.detailCard}>
//                 <div className={styles.detailHeader}>
//                   <h3>Aircraft</h3>
//                 </div>
//                 <div className={styles.aircraftDisplay}>
//                   <div className={styles.aircraftName}>{flight?.airplane?.name || 'N/A'}</div>
//                   <div className={styles.aircraftConfig}>
//                     <span>Rows: {flight?.airplane?.rows || 0}</span>
//                     <span>Seats: {((flight?.airplane?.rows || 0) * (flight?.airplane?.columns || 0))}</span>
//                   </div>
//                 </div>
//               </div>
//
//               {/* Duration Card */}
//               <div className={styles.detailCard}>
//                 <div className={styles.detailHeader}>
//                   <h3>Flight Duration</h3>
//                 </div>
//                 <div className={styles.durationDisplay}>
//                   <div className={styles.durationValue}>
//                     {flight?.durationMins
//                       ? `${Math.floor(flight.durationMins / 60)}h ${flight.durationMins % 60}m`
//                       : 'N/A'}
//                   </div>
//                 </div>
//               </div>
//
//               {/* Availability Card */}
//               <div className={styles.detailCard}>
//                 <div className={styles.detailHeader}>
//                   <h3>Seat Availability</h3>
//                 </div>
//                 <div className={styles.availabilityDisplay}>
//                   <div className={styles.seatInfo}>
//                     <span className={styles.seatLabel}>Economy</span>
//                     <span className={styles.seatCount}>
//                       {((flight?.totalSeats || 0) - (flight?.bookedSeats || 0))} / {flight?.totalSeats || 0} available
//                     </span>
//                   </div>
//                   <div className={styles.seatInfo}>
//                     <span className={styles.seatLabel}>Business</span>
//                     <span className={styles.seatCount}>
//                       {((flight?.businessSeats || 0) - (flight?.bookedBusinessSeats || 0))} / {flight?.businessSeats || 0} available
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//
//             {/* Pricing Section */}
//             <div className={styles.pricingSection}>
//               <h3>Available Services & Pricing</h3>
//               <div className={styles.priceGrid}>
//                 <div className={styles.priceCard}>
//                   <div className={styles.priceLabel}>Base Fare</div>
//                   <div className={styles.priceValue}>${(flight?.flightPrice || flight?.FlightPrice || flight?.economyPrice || flight?.EconomyPrice || 0)?.toFixed(2) || '0.00'}</div>
//                   <div className={styles.priceDesc}>Per person</div>
//                 </div>
//
//                 <div className={styles.priceCard}>
//                   <div className={styles.priceLabel}>Luggage</div>
//                   <div className={styles.priceValue}>${(flight?.luggagePrice || flight?.LuggagePrice || 0)?.toFixed(2) || '0.00'}</div>
//                   <div className={styles.priceDesc}>Optional add-on</div>
//                 </div>
//
//                 <div className={styles.priceCard}>
//                   <div className={styles.priceLabel}>Food Service</div>
//                   <div className={styles.priceValue}>${(flight?.foodPrice || flight?.FoodPrice || 0)?.toFixed(2) || '0.00'}</div>
//                   <div className={styles.priceDesc}>Optional add-on</div>
//                 </div>
//
//                 <div className={styles.priceCard}>
//                   <div className={styles.priceLabel}>Business Class</div>
//                   <div className={styles.priceValue}>${(flight?.businessPrice || flight?.BusinessPrice || flight?.premiumPrice || flight?.PremiumPrice || 0)?.toFixed(2) || '0.00'}</div>
//                   <div className={styles.priceDesc}>Premium seats</div>
//                 </div>
//               </div>
//             </div>
//
//             <div className={styles.buttonRow}>
//               <button className={styles.backBtn} onClick={() => navigate(-1)}>
//                 Cancel
//               </button>
//               <button className={styles.nextBtn} onClick={() => setStep(1)}>
//                 Proceed to Booking
//               </button>
//             </div>
//           </div>
//         )}
//
//         {step === 1 && (
//           <Step1PassengerDocuments
//             flight={flight}
//             passengers={passengers}
//             onNext={(data) => {
//               setPassengerData(data);
//               setStep(2);
//             }}
//             onBack={() => setStep(0)}
//           />
//         )}
//
//         {step === 2 && (
//            <Step2SeatSelection
//              flight={flight}
//              passengerData={passengerData}
//              onNext={(data) => {
//                setSelectedSeats(data);
//                setStep(3);
//              }}
//              onBack={() => setStep(1)}
//            />
//          )}
//
//          {step === 3 && (
//            <Step3Review
//              flight={flight}
//              returnFlight={returnFlight}
//              passengers={passengers}
//              passengerData={passengerData}
//              selectedSeats={selectedSeats}
//              onConfirm={(data) => {
//                // Booking confirmed
//              }}
//              onBack={() => setStep(2)}
//              navigate={navigate}
//            />
//          )}
//       </div>
//     </AppShell>
//   );
// }

import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';
import styles from './BookingPage.module.css';

// Enum mappings
const PASSENGER_TYPE = { Adult: 0, Kid: 1, Baby: 2, None: 3 };
const PASSENGER_TYPE_NAMES = { 0: 'Взрослый', 1: 'Ребёнок', 2: 'Младенец', 3: 'Не указан' };
const DOCUMENT_TYPE = { Passport: 0, ForeignPassport: 1, BirthCertificate: 2, Other: 3 };
const GENDER = { Male: 0, Female: 1 };
const FLIGHT_STATUS = { Scheduled: 0, CheckIn: 1, Boarding: 2, Departed: 3, Arrived: 4, Cancelled: 5, Delayed: 6 };

function Step1PassengerDocuments({ flight, passengers, onNext, onBack }) {
  const user = useAuthStore((state) => state.user);
  const [passengerData, setPassengerData] = useState([]);
  const [savedPassengers, setSavedPassengers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function loadPassengers() {
      try {
        const response = await apiClient.get('/passengers/me');
        setSavedPassengers(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Failed to load saved passengers:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPassengers();

    const totalPassengers = (passengers.adults || 0) + (passengers.kids || 0) + (passengers.babies || 0);
    setPassengerData(
      Array.from({ length: totalPassengers }, (_, i) => ({
        index: i,
        type: i < (passengers.adults || 0) ? PASSENGER_TYPE.Adult : i < (passengers.adults || 0) + (passengers.kids || 0) ? PASSENGER_TYPE.Kid : PASSENGER_TYPE.Baby,
        useExisting: false,
        existingPassengerId: null,
        documents: {
          type: 'Passport',
          gender: 'Male',
          firstName: '',
          middleName: '',
          lastName: '',
          number: '',
          series: '',
          dateOfBirth: '',
          validityPeriod: '',
        },
      }))
    );
  }, [passengers]);

  const allFieldsFilled = passengerData.every((p) => {
    if (p.useExisting && p.existingPassengerId) return true;
    return (
      p.documents.firstName &&
      p.documents.lastName &&
      p.documents.number &&
      p.documents.dateOfBirth &&
      p.documents.type &&
      p.documents.gender
    );
  });

  async function handleNext() {
    setCreating(true);
    setError('');
    try {
      const createdPassengers = [];
      for (let i = 0; i < passengerData.length; i++) {
        const pData = passengerData[i];
        let passengerId;

        if (pData.useExisting && pData.existingPassengerId) {
          passengerId = pData.existingPassengerId;
        } else {
          const validationPayload = {
            Type: DOCUMENT_TYPE[pData.documents.type] || 0,
            FirstName: pData.documents.firstName,
            MiddleName: pData.documents.middleName || null,
            LastName: pData.documents.lastName,
            Number: pData.documents.number,
            Series: pData.documents.series || null,
            Gender: GENDER[pData.documents.gender] || 0,
            DateOfBirth: pData.documents.dateOfBirth,
            ValidityPeriod: pData.documents.validityPeriod || null,
            UserId: user.id,
          };

          try {
            await apiClient.post('/documents/validate', validationPayload);
          } catch (validationErr) {
            throw new Error(validationErr.response?.data?.message || validationErr.message);
          }

          const passengerResp = await apiClient.post('/passengers', {
            userId: user.id,
            type: pData.type,
            isSaved: true,
          });
          passengerId = passengerResp.data.id || passengerResp.data.Id;

          await apiClient.post('/documents', {
            passengerId: passengerId,
            type: DOCUMENT_TYPE[pData.documents.type] || 0,
            firstName: pData.documents.firstName,
            middleName: pData.documents.middleName,
            lastName: pData.documents.lastName,
            gender: GENDER[pData.documents.gender] || 0,
            dateOfBirth: pData.documents.dateOfBirth,
            validityPeriod: pData.documents.validityPeriod || null,
            number: pData.documents.number,
            series: pData.documents.series || null,
            userId: user.id,
          });
        }
        createdPassengers.push({ ...pData, savedPassengerId: passengerId });
      }
      onNext(createdPassengers);
    } catch (err) {
      setError(err.message || 'Failed to create passengers');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className={styles.stepContent}>
      <h2>Шаг 1: Данные пассажиров</h2>
      <p>Добавьте или выберите пассажиров и их документы для бронирования.</p>
      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Загрузка сохранённых пассажиров...</div>
      ) : (
        <div className={styles.passengersGrid}>
          {passengerData.map((pData) => (
            <div key={pData.index} className={styles.passengerCard}>
              <div className={styles.passengerTitle}>
                Пассажир {pData.index + 1} ({PASSENGER_TYPE_NAMES[pData.type]})
              </div>
              <div className={styles.toggleOption}>
                <label>
                  <input
                    type="checkbox"
                    checked={pData.useExisting}
                    onChange={(e) => {
                      const updated = [...passengerData];
                      updated[pData.index].useExisting = e.target.checked;
                      setPassengerData(updated);
                    }}
                  />
                  Использовать сохранённого пассажира
                </label>
                {pData.useExisting && savedPassengers.length > 0 && (
                  <select
                    value={pData.existingPassengerId || ''}
                    onChange={(e) => {
                      const updated = [...passengerData];
                      updated[pData.index].existingPassengerId = e.target.value;
                      setPassengerData(updated);
                    }}
                    className={styles.selectPassenger}
                  >
                    <option value="">Выберите сохранённого пассажира...</option>
                    {savedPassengers.map((p) => {
                      const id = p.id || p.Id;
                      const doc = p.documents && p.documents.length > 0 ? p.documents[0] : null;
                      const name = doc ? `${doc.firstName || doc.FirstName} ${doc.lastName || doc.LastName}` : `Пассажир ${id}`;
                      return (
                        <option key={id} value={id}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              {!pData.useExisting && (
                <div className={styles.documentForm}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Тип документа</label>
                      <select
                        value={pData.documents.type}
                        onChange={(e) => {
                          const updated = [...passengerData];
                          updated[pData.index].documents.type = e.target.value;
                          setPassengerData(updated);
                        }}
                      >
                        <option value="Passport">Паспорт</option>
                        <option value="ForeignPassport">Заграничный паспорт</option>
                        <option value="BirthCertificate">Свидетельство о рождении</option>
                        <option value="Other">Другое</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Пол</label>
                      <select
                        value={pData.documents.gender}
                        onChange={(e) => {
                          const updated = [...passengerData];
                          updated[pData.index].documents.gender = e.target.value;
                          setPassengerData(updated);
                        }}
                      >
                        <option value="Male">Мужской</option>
                        <option value="Female">Женский</option>
                      </select>
                    </div>
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Имя *</label>
                      <input
                        type="text"
                        value={pData.documents.firstName}
                        onChange={(e) => {
                          const updated = [...passengerData];
                          updated[pData.index].documents.firstName = e.target.value;
                          setPassengerData(updated);
                        }}
                        placeholder="Имя"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Отчество</label>
                      <input
                        type="text"
                        value={pData.documents.middleName}
                        onChange={(e) => {
                          const updated = [...passengerData];
                          updated[pData.index].documents.middleName = e.target.value;
                          setPassengerData(updated);
                        }}
                        placeholder="Отчество (необязательно)"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Фамилия *</label>
                      <input
                        type="text"
                        value={pData.documents.lastName}
                        onChange={(e) => {
                          const updated = [...passengerData];
                          updated[pData.index].documents.lastName = e.target.value;
                          setPassengerData(updated);
                        }}
                        placeholder="Фамилия"
                      />
                    </div>
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Номер документа *</label>
                      <input
                        type="text"
                        value={pData.documents.number}
                        onChange={(e) => {
                          const updated = [...passengerData];
                          updated[pData.index].documents.number = e.target.value;
                          setPassengerData(updated);
                        }}
                        placeholder="Номер документа"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Серия (необязательно)</label>
                      <input
                        type="text"
                        value={pData.documents.series}
                        onChange={(e) => {
                          const updated = [...passengerData];
                          updated[pData.index].documents.series = e.target.value;
                          setPassengerData(updated);
                        }}
                        placeholder="Серия"
                      />
                    </div>
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Дата рождения *</label>
                      <input
                        type="date"
                        value={pData.documents.dateOfBirth}
                        onChange={(e) => {
                          const updated = [...passengerData];
                          updated[pData.index].documents.dateOfBirth = e.target.value;
                          setPassengerData(updated);
                        }}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Срок действия (необязательно)</label>
                      <input
                        type="date"
                        value={pData.documents.validityPeriod}
                        onChange={(e) => {
                          const updated = [...passengerData];
                          updated[pData.index].documents.validityPeriod = e.target.value;
                          setPassengerData(updated);
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div className={styles.buttonRow}>
        <button className={styles.backBtn} onClick={onBack}>Назад</button>
        <button className={styles.nextBtn} onClick={handleNext} disabled={!allFieldsFilled || creating}>
          {creating ? 'Создание...' : 'Далее: выбрать места'}
        </button>
      </div>
    </div>
  );
}

function Step2SeatSelection({ flight, passengerData, onNext, onBack }) {
  const [selectedSeats, setSelectedSeats] = useState({});
  const [seatTypes, setSeatTypes] = useState({});
  const bookedSeats = flight.bookings || [];

  useEffect(() => {
    const seats = {};
    const types = {};
    passengerData.forEach((_, i) => {
      seats[i] = null;
      types[i] = 'economy';
    });
    setSelectedSeats(seats);
    setSeatTypes(types);
  }, [passengerData]);

  const generateSeatMap = () => {
    const airplane = flight.airplane;
    const seats = [];
    for (let row = 1; row <= airplane.buisnessRows; row++) {
      const rowData = {};
      const letters = ['A', 'C', 'D', 'F'];
      for (const letter of letters) {
        const seatNumber = `${row}${letter}`;
        rowData[letter] = { number: seatNumber, isBooked: bookedSeats.includes(seatNumber), isBusiness: true };
      }
      seats.push({ type: 'business', row, seats: rowData, letters });
    }
    const economyStartRow = airplane.buisnessRows + 1;
    let economyRowCount = 0;
    for (let row = economyStartRow; row < economyStartRow + airplane.rows; row++) {
      if (economyRowCount === 7) seats.push({ type: 'spacer' });
      const rowData = {};
      const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
      for (const letter of letters) {
        const seatNumber = `${row}${letter}`;
        rowData[letter] = { number: seatNumber, isBooked: bookedSeats.includes(seatNumber), isBusiness: false };
      }
      seats.push({ type: 'economy', row, seats: rowData, letters });
      economyRowCount++;
    }
    return seats;
  };

  const seatMap = generateSeatMap();

  function handleSeatClick(seatNumber, passengerIndex, isBusiness = false) {
    if (selectedSeats[passengerIndex] === seatNumber) {
      setSelectedSeats((prev) => ({ ...prev, [passengerIndex]: null }));
      setSeatTypes((prev) => ({ ...prev, [passengerIndex]: 'economy' }));
    } else {
      setSelectedSeats((prev) => ({ ...prev, [passengerIndex]: seatNumber }));
      setSeatTypes((prev) => ({ ...prev, [passengerIndex]: isBusiness ? 'business' : 'economy' }));
    }
  }

  const allSeatsSelected = Object.values(selectedSeats).every((s) => s !== null);

  return (
    <div className={styles.stepContent}>
      <h2>Шаг 2: Выбор мест</h2>
      <p>Нажмите на место, чтобы выбрать его для пассажира. Нажмите ещё раз, чтобы отменить выбор.</p>
      <div className={styles.seatSelectionContainer}>
        <div className={styles.seatSelectionLeft}>
          <div className={styles.seatMap}>
            <div className={styles.seatTitle}>Схема салона самолёта</div>
            <div className={styles.seatMapContent}>
              {seatMap.map((row, rowIndex) => {
                if (row.type === 'spacer') return <div key="spacer" className={styles.spacer}></div>;
                const isBusiness = row.type === 'business';
                return (
                  <div key={rowIndex} className={styles.seatRowWrapper}>
                    <div className={styles.rowNumber}>{row.row}</div>
                    <div className={styles.seatsLeftGroup}>
                      {row.letters.slice(0, isBusiness ? 2 : 3).map((letter) => {
                        const seat = row.seats[letter];
                        const isSelected = Object.values(selectedSeats).includes(seat.number);
                        return (
                          <button
                            key={seat.number}
                            className={`${styles.seat} ${isBusiness ? styles.seatBusiness : ''} ${seat.isBooked ? styles.seatBooked : ''} ${isSelected ? styles.seatSelected : ''}`}
                            onClick={() => {
                              if (!seat.isBooked) {
                                const passengerIdx = Object.entries(selectedSeats).find(([_, s]) => s === seat.number)?.[0];
                                if (passengerIdx !== undefined) {
                                  handleSeatClick(seat.number, parseInt(passengerIdx), isBusiness);
                                } else {
                                  const unassigned = passengerData.findIndex((_, i) => !selectedSeats[i]);
                                  if (unassigned >= 0) handleSeatClick(seat.number, unassigned, isBusiness);
                                }
                              }
                            }}
                            disabled={seat.isBooked}
                            title={seat.number}
                          >
                            {seat.number}
                            {isSelected && <span className={styles.seatAssignedBadge}>
                              {Object.entries(selectedSeats).find(([_, s]) => s === seat.number)?.[0] !== undefined
                                ? parseInt(Object.entries(selectedSeats).find(([_, s]) => s === seat.number)?.[0]) + 1
                                : ''}
                            </span>}
                          </button>
                        );
                      })}
                    </div>
                    <div className={styles.aisle}></div>
                    <div className={styles.seatsRightGroup}>
                      {row.letters.slice(isBusiness ? 2 : 3).map((letter) => {
                        const seat = row.seats[letter];
                        const isSelected = Object.values(selectedSeats).includes(seat.number);
                        return (
                          <button
                            key={seat.number}
                            className={`${styles.seat} ${isBusiness ? styles.seatBusiness : ''} ${seat.isBooked ? styles.seatBooked : ''} ${isSelected ? styles.seatSelected : ''}`}
                            onClick={() => {
                              if (!seat.isBooked) {
                                const passengerIdx = Object.entries(selectedSeats).find(([_, s]) => s === seat.number)?.[0];
                                if (passengerIdx !== undefined) {
                                  handleSeatClick(seat.number, parseInt(passengerIdx), isBusiness);
                                } else {
                                  const unassigned = passengerData.findIndex((_, i) => !selectedSeats[i]);
                                  if (unassigned >= 0) handleSeatClick(seat.number, unassigned, isBusiness);
                                }
                              }
                            }}
                            disabled={seat.isBooked}
                            title={seat.number}
                          >
                            {seat.number}
                            {isSelected && <span className={styles.seatAssignedBadge}>
                              {Object.entries(selectedSeats).find(([_, s]) => s === seat.number)?.[0] !== undefined
                                ? parseInt(Object.entries(selectedSeats).find(([_, s]) => s === seat.number)?.[0]) + 1
                                : ''}
                            </span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
        </div>
        <div className={styles.passengerSeatAssignment}>
          <h3>Распределение мест</h3>
          {passengerData.map((p, i) => {
            const firstName = p.documents?.firstName || p.documents?.FirstName || '';
            const lastName = p.documents?.lastName || p.documents?.LastName || '';
            const passengerName = firstName ? `${firstName} ${lastName}`.trim() : `Пассажир ${i + 1}`;
            return (
              <div key={i} className={styles.passengerSeatRow}>
                <div className={styles.passengerLabel}>
                  <svg className={styles.passengerNameIcon} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  <span>{passengerName}</span>
                </div>
                <div className={`${styles.seatDisplay} ${selectedSeats[i] ? styles.seatDisplayAssigned : ''}`}>
                  {selectedSeats[i] || 'Не назначено'}
                </div>
                {selectedSeats[i] && (
                  <button className={styles.clearSeatBtn} onClick={() => handleSeatClick(selectedSeats[i], i)} title="Отменить выбор">✕</button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className={styles.buttonRow}>
        <button className={styles.backBtn} onClick={onBack}>Назад</button>
        <button className={styles.nextBtn} onClick={() => onNext({ seats: selectedSeats, seatTypes: seatTypes })} disabled={!allSeatsSelected}>
          Далее: услуги
        </button>
      </div>
    </div>
  );
}

function StepReviewServices({ flight, passengerData, selectedSeats, onNext, onBack }) {
  const [localServices, setLocalServices] = useState(
    passengerData.map(() => ({ hasLuggage: false, hasFood: false }))
  );

  const calculateTotal = () => {
    let total = 0;
    const seatTypes = selectedSeats.seatTypes || {};
    const seats = selectedSeats.seats || selectedSeats;

    passengerData.forEach((p, i) => {
      const isBusiness = seatTypes[i] === 'business';
      const businessPrice = flight?.businessPrice || flight?.BusinessPrice || flight?.premiumPrice || flight?.PremiumPrice || 0;
      const economyPrice = flight?.flightPrice || flight?.FlightPrice || flight?.economyPrice || flight?.EconomyPrice || 0;
      const basePrice = isBusiness ? (businessPrice || economyPrice || 0) : (economyPrice || 0);
      total += basePrice;

      if (localServices[i].hasLuggage) total += flight?.luggagePrice || flight?.LuggagePrice || 0;
      if (localServices[i].hasFood) total += flight?.foodPrice || flight?.FoodPrice || 0;
    });
    return total;
  };

  return (
    <div className={styles.stepContent}>
      <h2>Проверка и услуги</h2>
      <p>Добавьте дополнительные услуги для этого рейса.</p>
      <div className={styles.reviewSummary}>
        <div className={styles.reviewSection}>
          <h3>Данные рейса</h3>
          <div className={styles.reviewRow}>
            <span>Маршрут: </span>
            <span>{flight?.fromAirport?.city || 'N/A'} → {flight?.toAirport?.city || 'N/A'}</span>
          </div>
          {passengerData.map((p, i) => {
            const firstName = p.documents?.firstName || p.documents?.FirstName || '';
            const lastName = p.documents?.lastName || p.documents?.LastName || '';
            const passengerName = firstName ? `${firstName} ${lastName}`.trim() : `Пассажир ${i + 1}`;
            const seatTypes = selectedSeats.seatTypes || {};
            const seats = selectedSeats.seats || selectedSeats;
            const isBusiness = seatTypes[i] === 'business';
            const businessPrice = flight?.businessPrice || flight?.BusinessPrice || flight?.premiumPrice || flight?.PremiumPrice || 0;
            const economyPrice = flight?.flightPrice || flight?.FlightPrice || flight?.economyPrice || flight?.EconomyPrice || 0;
            const basePrice = isBusiness ? (businessPrice || economyPrice || 0) : (economyPrice || 0);

            return (
              <div key={i} className={styles.passengerReviewCard}>
                <div className={styles.passengerReviewHeader}>
                  <div>
                    <strong>{passengerName}</strong>
                    <small>Место: {seats[i]} {isBusiness ? '(Бизнес)' : ''}</small>
                  </div>
                  <div className={styles.passengerPrice}>${basePrice.toFixed(2)}</div>
                </div>
                <div className={styles.serviceCheckboxes}>
                  <label>
                    <input
                      type="checkbox"
                      checked={localServices[i].hasLuggage}
                      onChange={(e) => {
                        const updated = [...localServices];
                        updated[i].hasLuggage = e.target.checked;
                        setLocalServices(updated);
                      }}
                    />
                    Багаж +${(flight?.luggagePrice || flight?.LuggagePrice || 0).toFixed(2)}
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={localServices[i].hasFood}
                      onChange={(e) => {
                        const updated = [...localServices];
                        updated[i].hasFood = e.target.checked;
                        setLocalServices(updated);
                      }}
                    />
                    Питание +${(flight?.foodPrice || flight?.FoodPrice || 0).toFixed(2)}
                  </label>
                </div>
              </div>
            );
          })}
        </div>
        <div className={styles.reviewTotal}>
          <h3>Итого за рейс: ${calculateTotal().toFixed(2)}</h3>
        </div>
      </div>
      <div className={styles.buttonRow}>
        <button className={styles.backBtn} onClick={onBack}>Назад</button>
        <button className={styles.nextBtn} onClick={() => onNext(localServices)}>Далее</button>
      </div>
    </div>
  );
}

function FinalConfirmation({ outboundFlight, returnFlight, passengerData, outboundSeats, returnSeats, outboundServices, returnServices, onBack }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate(); // Используем хук напрямую для надежности редиректа

  const calculateFlightTotal = (flight, seats, services, seatTypes) => {
    let total = 0;
    const seatList = seats.seats || seats;
    const types = seatTypes || {};
    passengerData.forEach((_, i) => {
      const isBusiness = types[i] === 'business';
      const businessPrice = flight?.businessPrice || flight?.BusinessPrice || flight?.premiumPrice || flight?.PremiumPrice || 0;
      const economyPrice = flight?.flightPrice || flight?.FlightPrice || flight?.economyPrice || flight?.EconomyPrice || 0;
      const basePrice = isBusiness ? (businessPrice || economyPrice || 0) : (economyPrice || 0);
      total += basePrice;
      if (services[i]?.hasLuggage) total += flight?.luggagePrice || flight?.LuggagePrice || 0;
      if (services[i]?.hasFood) total += flight?.foodPrice || flight?.FoodPrice || 0;
    });
    return total;
  };

  async function handleFinalConfirm() {
    setLoading(true);
    setError('');
    try {
      const outboundSeatTypes = outboundSeats.seatTypes || {};
      const outboundSeatList = outboundSeats.seats || outboundSeats;
      const bookings = [];

      // 1. Формируем бронирования для рейса ТУДА
      passengerData.forEach((p, i) => {
        bookings.push({
          PassengerId: p.savedPassengerId,
          FlightId: outboundFlight.id || outboundFlight.Id,
          SeatNumber: outboundSeatList[i],
          HasLuggage: outboundServices[i]?.hasLuggage || false,
          HasFood: outboundServices[i]?.hasFood || false,
          IsBusiness: outboundSeatTypes[i] === 'business',
        });
      });

      // 2. Формируем бронирования для рейса ОБРАТНО (если есть)
      if (returnFlight) {
        const returnSeatTypes = returnSeats.seatTypes || {};
        const returnSeatList = returnSeats.seats || returnSeats;
        passengerData.forEach((p, i) => {
          bookings.push({
            PassengerId: p.savedPassengerId,
            FlightId: returnFlight.id || returnFlight.Id,
            SeatNumber: returnSeatList[i],
            HasLuggage: returnServices[i]?.hasLuggage || false,
            HasFood: returnServices[i]?.hasFood || false,
            IsBusiness: returnSeatTypes[i] === 'business',
          });
        });
      }

      // 3. Отправляем ОДИН заказ со всеми бронированиями
      console.log("Sending Order Payload:", { UserId: user.id, Bookings: bookings });

      const response = await apiClient.post('/orders', {
        UserId: user.id,
        Bookings: bookings,
      });

      const orderId = response.data?.id || response.data?.Id || response.data;

      if (orderId) {
        navigate(`/order-confirmation/${orderId}`);
      } else {
        throw new Error("Server returned success but no Order ID was provided.");
      }
    } catch (err) {
      setError(`Failed to create booking: ${err.response?.data?.message || err.message}`);
      console.error('Booking error:', err);
    } finally {
      setLoading(false);
    }
  }

  const outboundTotal = calculateFlightTotal(outboundFlight, outboundSeats, outboundServices, outboundSeats.seatTypes);
  const returnTotal = returnFlight ? calculateFlightTotal(returnFlight, returnSeats, returnServices, returnSeats.seatTypes) : 0;

  return (
    <div className={styles.stepContent}>
      <h2>Подтвердите бронирование</h2>
      <p>Проверьте все рейсы и подтвердите единый заказ.</p>
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.reviewSummary}>
        <div className={styles.reviewSection}>
          <h3>Рейс туда</h3>
          <div className={styles.reviewRow}>
            <span>Маршрут: </span>
            <span>{outboundFlight?.fromAirport?.city || 'N/A'} → {outboundFlight?.toAirport?.city || 'N/A'}</span>
          </div>
          <div className={styles.reviewRow}>
            <span>Цена рейса: </span>
            <span>₽{outboundTotal.toFixed(2)}</span>
          </div>
        </div>

        {returnFlight && (
          <div className={styles.reviewSection}>
            <h3>Обратный рейс</h3>
            <div className={styles.reviewRow}>
              <span>Маршрут: </span>
              <span>{returnFlight?.fromAirport?.city || 'N/A'} → {returnFlight?.toAirport?.city || 'N/A'}</span>
            </div>
            <div className={styles.reviewRow}>
              <span>Цена рейса: </span>
              <span>${returnTotal.toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className={styles.reviewTotal}>
          <h3>Итоговая цена заказа: ₽{(outboundTotal + returnTotal).toFixed(2)}</h3>
        </div>
      </div>

      <div className={styles.buttonRow}>
        <button className={styles.backBtn} onClick={onBack}>Назад</button>
        <button className={styles.confirmBtn} onClick={handleFinalConfirm} disabled={loading}>
          {loading ? 'Обработка...' : 'Подтвердить и создать заказ'}
        </button>
      </div>
    </div>
  );
}

export function BookingPage() {
  const { flightId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [flight, setFlight] = useState(null);
  const [returnFlight, setReturnFlight] = useState(location.state?.returnFlight || null);
  const [passengers, setPassengers] = useState(location.state?.passengers || {});

  const [step, setStep] = useState(0);
  const [passengerData, setPassengerData] = useState([]);

  // Состояния для раздельного хранения данных по рейсам
  const [outboundSeats, setOutboundSeats] = useState({});
  const [returnSeats, setReturnSeats] = useState({});
  const [outboundServices, setOutboundServices] = useState([]);
  const [returnServices, setReturnServices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const hasReturn = !!returnFlight;

  useEffect(() => {
    async function loadFlight() {
      if (!flightId) {
        setError('Рейс не выбран');
        return;
      }
      try {
        const response = await apiClient.get(`/flights/${flightId}`);
        const flightData = response.data;
        const status = flightData.status;
        if (status !== FLIGHT_STATUS.Scheduled && status !== FLIGHT_STATUS.CheckIn) {
          setError('Этот рейс больше недоступен для бронирования.');
          return;
        }
        setFlight(flightData);
      } catch (err) {
        setError('Не удалось загрузить данные рейса');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadFlight();
  }, [flightId]);

  if (loading) {
    return (
      <AppShell title="Бронирование рейса" subtitle="Завершите бронирование">
        <div className={styles.container}>
          <div className={styles.loading}>Загрузка данных рейса...</div>
        </div>
      </AppShell>
    );
  }

  if (error || !flight) {
    return (
      <AppShell title="Бронирование рейса" subtitle="Завершите бронирование">
        <div className={styles.container}>
          <div className={styles.error}>{error || 'Рейс не найден'}</div>
          <button onClick={() => navigate(-1)} className={styles.backBtn}>Назад</button>
        </div>
      </AppShell>
    );
  }

  const handleNextStep = () => {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(hasReturn ? 3 : 4);
    else if (step === 3) setStep(4);
    else if (step === 4) setStep(hasReturn ? 5 : 6);
    else if (step === 5) setStep(6);
  };

  const handlePrevStep = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(hasReturn ? 3 : 2);
    else if (step === 5) setStep(4);
    else if (step === 6) setStep(hasReturn ? 5 : 4);
  };

  return (
    <AppShell title="Бронирование рейса" subtitle="Завершите бронирование">
      <div className={styles.container}>
        <div className={styles.stepsIndicator}>
          <div className={`${styles.step} ${step === 0 ? styles.stepActive : step > 0 ? styles.stepComplete : ''}`}>0. Рейс</div>
          <div className={`${styles.step} ${step === 1 ? styles.stepActive : step > 1 ? styles.stepComplete : ''}`}>1. Пассажиры</div>
          <div className={`${styles.step} ${step === 2 ? styles.stepActive : step > 2 ? styles.stepComplete : ''}`}>2. Места туда</div>
          {hasReturn && <div className={`${styles.step} ${step === 3 ? styles.stepActive : step > 3 ? styles.stepComplete : ''}`}>3. Места обратно</div>}
          <div className={`${styles.step} ${step === (hasReturn ? 4 : 3) ? styles.stepActive : step > (hasReturn ? 4 : 3) ? styles.stepComplete : ''}`}>{hasReturn ? '4' : '3'}. Услуги туда</div>
          {hasReturn && <div className={`${styles.step} ${step === 5 ? styles.stepActive : step > 5 ? styles.stepComplete : ''}`}>5. Услуги обратно</div>}
          <div className={`${styles.step} ${step === (hasReturn ? 6 : 4) ? styles.stepActive : ''}`}>{hasReturn ? '6' : '4'}. Подтверждение</div>
        </div>

        {step === 0 && (
          <div className={styles.stepContent}>
            <h2>Информация о рейсе</h2>
            <p>Проверьте данные рейса и доступные услуги.</p>
            <div className={styles.flightDetailsGrid}>
              <div className={styles.detailCard}>
                <div className={styles.detailHeader}><h3>Маршрут</h3></div>
                <div className={styles.routeDisplay}>
                  <div className={styles.routePoint}>
                    <div className={styles.routeCity}>{flight?.fromAirport?.city || 'N/A'}</div>
                    <div className={styles.routeCode}>{flight?.fromAirport?.code || '---'}</div>
                  </div>
                  <div className={styles.routeArrow}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </div>
                  <div className={styles.routePoint}>
                    <div className={styles.routeCity}>{flight?.toAirport?.city || 'N/A'}</div>
                    <div className={styles.routeCode}>{flight?.toAirport?.code || '---'}</div>
                  </div>
                </div>
              </div>

               {/* Times Card */}
               <div className={styles.detailCard}>
                 <div className={styles.detailHeader}>
                   <h3>Вылет и прибытие</h3>
                 </div>
                 <div className={styles.timesDisplay}>
                   <div className={styles.timeBlock}>
                     <span className={styles.timeLabel}>Вылет</span>
                     <span className={styles.timeValue}>
                       {flight?.departureTime
                        ? new Date(flight.departureTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false })
                        : 'N/A'}
                    </span>
                    <span className={styles.dateValue}>
                      {flight?.departureTime
                        ? new Date(flight.departureTime).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'N/A'}
                    </span>
                  </div>
                  <div className={styles.timeBlock}>
                    <span className={styles.timeLabel}>Прибытие</span>
                    <span className={styles.timeValue}>
                      {flight?.arrivalTime
                        ? new Date(flight.arrivalTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false })
                        : 'N/A'}
                    </span>
                    <span className={styles.dateValue}>
                      {flight?.arrivalTime
                        ? new Date(flight.arrivalTime).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Duration Card */}
              <div className={styles.detailCard}>
                <div className={styles.detailHeader}>
                  <h3>Длительность полёта</h3>
                </div>
                <div className={styles.durationDisplay}>
                  <div className={styles.durationValue}>
                    {flight?.durationMins
                      ? `${Math.floor(flight.durationMins / 60)}ч ${flight.durationMins % 60}м`
                      : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Availability Card */}
              <div className={styles.detailCard}>
                <div className={styles.detailHeader}>
                  <h3>Свободные места</h3>
                </div>
                <div className={styles.availabilityDisplay}>
                  <div className={styles.seatInfo}>
                    <span className={styles.seatLabel}>Эконом</span>
                    <span className={styles.seatCount}>
                      {((flight?.totalSeats || 0) - (flight?.bookedSeats || 0))} / {flight?.totalSeats || 0} доступно
                    </span>
                  </div>
                  <div className={styles.seatInfo}>
                    <span className={styles.seatLabel}>Бизнес</span>
                    <span className={styles.seatCount}>
                      {((flight?.businessSeats || 0) - (flight?.bookedBusinessSeats || 0))} / {flight?.businessSeats || 0} доступно
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div className={styles.pricingSection}>
              <h3>Доступные услуги и цены</h3>
              <div className={styles.priceGrid}>
                <div className={styles.priceCard}>
                  <div className={styles.priceLabel}>Базовый тариф</div>
                  <div className={styles.priceValue}>₽{(flight?.flightPrice || flight?.FlightPrice || flight?.economyPrice || flight?.EconomyPrice || 0)?.toFixed(2) || '0.00'}</div>
                  <div className={styles.priceDesc}>На человека</div>
                </div>

                <div className={styles.priceCard}>
                  <div className={styles.priceLabel}>Багаж</div>
                  <div className={styles.priceValue}>₽{(flight?.luggagePrice || flight?.LuggagePrice || 0)?.toFixed(2) || '0.00'}</div>
                  <div className={styles.priceDesc}>Дополнительная услуга</div>
                </div>

                <div className={styles.priceCard}>
                  <div className={styles.priceLabel}>Питание</div>
                  <div className={styles.priceValue}>₽{(flight?.foodPrice || flight?.FoodPrice || 0)?.toFixed(2) || '0.00'}</div>
                  <div className={styles.priceDesc}>Дополнительная услуга</div>
                </div>

                <div className={styles.priceCard}>
                  <div className={styles.priceLabel}>Бизнес-класс</div>
                  <div className={styles.priceValue}>₽{(flight?.businessPrice || flight?.BusinessPrice || flight?.premiumPrice || flight?.PremiumPrice || 0)?.toFixed(2) || '0.00'}</div>
                  <div className={styles.priceDesc}>Места повышенного комфорта</div>
                </div>
              </div>
              {/* Остальные карточки (Times, Aircraft, Duration, Availability, Pricing) можно оставить как в оригинале, они не влияют на логику шагов */}
            </div>
            <div className={styles.buttonRow}>
              <button className={styles.backBtn} onClick={() => navigate(-1)}>Отмена</button>
              <button className={styles.nextBtn} onClick={() => setStep(1)}>Перейти к бронированию</button>
            </div>
          </div>
        )}

        {step === 1 && (
          <Step1PassengerDocuments
            flight={flight}
            passengers={passengers}
            onNext={(data) => { setPassengerData(data); handleNextStep(); }}
            onBack={() => setStep(0)}
          />
        )}

        {step === 2 && (
          <Step2SeatSelection
            flight={flight}
            passengerData={passengerData}
            onNext={(data) => { setOutboundSeats(data); handleNextStep(); }}
            onBack={handlePrevStep}
          />
        )}

        {hasReturn && step === 3 && (
          <Step2SeatSelection
            flight={returnFlight}
            passengerData={passengerData}
            onNext={(data) => { setReturnSeats(data); handleNextStep(); }}
            onBack={handlePrevStep}
          />
        )}

        {step === (hasReturn ? 4 : 3) && (
          <StepReviewServices
            flight={flight}
            passengerData={passengerData}
            selectedSeats={outboundSeats}
            onNext={(data) => { setOutboundServices(data); handleNextStep(); }}
            onBack={handlePrevStep}
          />
        )}

        {hasReturn && step === 5 && (
          <StepReviewServices
            flight={returnFlight}
            passengerData={passengerData}
            selectedSeats={returnSeats}
            onNext={(data) => { setReturnServices(data); handleNextStep(); }}
            onBack={handlePrevStep}
          />
        )}

        {step === (hasReturn ? 6 : 4) && (
          <FinalConfirmation
            outboundFlight={flight}
            returnFlight={returnFlight}
            passengerData={passengerData}
            outboundSeats={outboundSeats}
            returnSeats={returnSeats}
            outboundServices={outboundServices}
            returnServices={returnServices}
            onBack={handlePrevStep}
          />
        )}
      </div>
    </AppShell>
  );
}