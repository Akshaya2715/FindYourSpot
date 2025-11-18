// src/components/BookingsPage.jsx
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./BookingsPage.css";

const BookingsPage = () => {
    const location = useLocation();
    const { selectedArea, selectedDate } = location.state || {};

    useEffect(() => {
        const fetchBookings = async () => {
            const res = await fetch("http://localhost:5000/api/bookings/all");
            const data = await res.json();
            const filtered = data.filter(b =>
                (!selectedArea || b.area === selectedArea) &&
                (!selectedDate || b.date === selectedDate)
            );
            setBookings(filtered);
            setFilteredBookings(filtered);
        };
        fetchBookings();
    }, [selectedArea, selectedDate]);

    const { filteredBookings: passedBookings } = location.state || {};

    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState("date");
    const [sortOrder, setSortOrder] = useState("asc");

    // Load passed bookings from AdminDashboard
    useEffect(() => {
        if (passedBookings && passedBookings.length > 0) {
            setBookings(passedBookings);
            setFilteredBookings(passedBookings);
        } else {
            setBookings([]);
            setFilteredBookings([]);
        }
    }, [passedBookings]);

    // Filter + Search + Sort
    useEffect(() => {
        let updated = bookings.filter((b) =>
            (b.name || "").toLowerCase().includes(search.toLowerCase()) ||
            (b.email || b.phone || "").toLowerCase().includes(search.toLowerCase())
        );

        updated.sort((a, b) => {
            const aVal = (a[sortField] || "").toString().toLowerCase();
            const bVal = (b[sortField] || "").toString().toLowerCase();
            if (sortOrder === "asc") return aVal > bVal ? 1 : -1;
            return aVal < bVal ? 1 : -1;
        });

        setFilteredBookings(updated);
    }, [search, bookings, sortField, sortOrder]);

    // PDF Export
    const exportToPDF = () => {
        if (!filteredBookings.length) {
            alert("No bookings to export!");
            return;
        }

        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Bookings Report", 14, 20);

        doc.setFontSize(11);
        const today = new Date();
        doc.text(`Generated: ${today.toLocaleString()}`, 14, 28);

        const tableColumn = ["Name", "Email/Phone", "Area", "Spot", "Date", "Time"];
        const tableRows = filteredBookings.map((b) => [
            b.name || "-",
            b.email || b.phone || "-",
            b.area || "-",
            b.spot || "-",
            b.date || "-",
            b.time || "-",
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 35,
            styles: { fontSize: 12 },
            headStyles: { fillColor: [255, 77, 77], textColor: 255 },
            alternateRowStyles: { fillColor: [240, 240, 240] },
            margin: { left: 14, right: 14 },
            didDrawPage: (data) => {
                const pageCount = doc.internal.getNumberOfPages();
                doc.setFontSize(10);
                doc.text(
                    `Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${pageCount}`,
                    data.settings.margin.left,
                    doc.internal.pageSize.height - 10
                );
            },
        });

        doc.save("bookings_report.pdf");
    };

    return (
        <div className="bookings-container">
            <h2>Bookings</h2>

            {/* Search & Controls */}
            <div className="filters">
                <input
                    type="text"
                    placeholder="Search by name, email, or phone"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select value={sortField} onChange={(e) => setSortField(e.target.value)}>
                    <option value="name">Name</option>
                    <option value="area">Area</option>
                    <option value="date">Date</option>
                    <option value="time">Time</option>
                </select>
                <button onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
                    {sortOrder === "asc" ? "Asc" : "Desc"}
                </button>
                <button onClick={exportToPDF}>Export PDF</button>
            </div>

            {/* Bookings Table */}
            <table>
                <thead>
                    <tr style={{ backgroundColor: "red", color: "white" }}>
                        <th>Name</th>
                        <th>Email / Phone</th>
                        <th>Area</th>
                        <th>Spot</th>
                        <th>Date</th>
                        <th>Time</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredBookings.length > 0 ? (
                        filteredBookings.map((b, idx) => (
                            <tr key={idx}>
                                <td>{b.name || "-"}</td>
                                <td>{b.email || b.phone || "-"}</td>
                                <td>{b.area || "-"}</td>
                                <td>{b.spot || "-"}</td>
                                <td>{b.date || "-"}</td>
                                <td>{b.time || "-"}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6" style={{ textAlign: "center", fontStyle: "italic" }}>
                                No bookings found
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default BookingsPage;