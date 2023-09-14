import React, { useState, useEffect } from 'react';
import axios from 'axios';

const buttonStyle = {
    padding: '10px 15px',
    borderRadius: '5px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    marginRight: '10px'
};

const buttonStyleMap = {
    padding: '10px 15px',
    borderRadius: '5px',
    backgroundColor: '#F6F6F6',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    marginRight: '10px',
    fontSize: '28px'
};

const buttonStyleCode = {
    padding: '5px 4px',
    borderRadius: '5px',
    backgroundColor: '#3a3a3a',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    marginRight: '10px',
    marginBottom: '1px'
};

const SeatingMap = ({ cart, onSeatsSelected }) => {
    const [bitmap, setBitmap] = useState(0);

// New state for showing or hiding the code
const [showCode, setShowCode] = useState(false);

// Function to toggle the visibility of the code block
const toggleCode = () => {
    setShowCode(prevState => !prevState);
}

    useEffect(() => {
        axios.get('http://localhost:3001/seating').then(response => {
            setBitmap(response.data.bitmap);
        });
    }, []);

    const toggleSeat = (seatIndex) => {
        const isSelected = (bitmap & (1 << seatIndex));
        const totalSelected = bitmap.toString(2).split('1').length - 1;

        // If trying to select a new seat while already having 4 selected
        if (!isSelected && totalSelected === 4) {
            alert("You can't select more than 4 seats!");
            return;
        }

        axios.post('http://localhost:3001/setSeat', { seatIndex }).then(response => {
            setBitmap(response.data.bitmap);
        }).catch(err => {
            if (err.response && err.response.data && err.response.data.error) {
                alert(err.response.data.error);
            } else {
                alert('An error occurred!');
            }
        });
    };

    const getSeatColor = (index) => {
        const isSelected = (bitmap & (1 << index));
        const totalSelected = bitmap.toString(2).split('1').length - 1;
    
        // Check if the seat is in the cart
        const seatName = `seat${index}`;
        if (cart && cart[seatName]) {
            return '💲';  // Dollar emoji for seats in the cart
        } else if (isSelected) {
            return '✅';  // Tick for selected seats
        } else if (totalSelected === 4) {
            return '🔒';  // Lock for unselected when 4 are selected
        } else {
            return '💺';  // Regular seat emoji
        }
    };

    const emptySelection = () => {
        // Let's assume your backend provides an API to set the entire bitmap to zeros.
        axios.post('http://localhost:3001/emptySelection').then(response => {
            setBitmap(0); // Set the local bitmap to zero.
        }).catch(err => {
            alert('An error occurred while emptying the selection!');
        });
    };
    
    

        // This function collects the selected seats and sends them to the cart.
        const handleAddToCart = () => {
            const selectedSeats = [];
            Array.from({ length: 16 }).forEach((_, index) => {
                if (bitmap & (1 << index)) {
                    selectedSeats.push(index);
                }
            });
    
            onSeatsSelected(selectedSeats);  // Notify parent component about the selected seats
        };
        console.log('Cart:', cart);

        const titleStyle = {
            borderBottom: '2px solid #3498db',
            paddingBottom: '10px',
            marginTop: '20px'
        };

        return (
            <div>
                <h3 style={titleStyle}>Select up to 4 Seats</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    {Array.from({ length: 16 }).map((_, index) => {
                        const seatIdentifier = `seat${index}`;
                        const isSeatInCart = cart && cart[seatIdentifier];
                        
                        return (
                            <button key={index} style={buttonStyleMap} onClick={() => toggleSeat(index)}>
                                {isSeatInCart ? '💵' : getSeatColor(index)}
                            </button>
                        );
                    })}
                </div>
                <h3 style={titleStyle}>Bitmap Rendering</h3>
                <div style={{ marginTop: '20px' }}>
                    {bitmap.toString(2).padStart(16, '0').split('').map((bit, index) => (
                        <span key={index} style={{ background: bit === '1' ? 'yellow' : 'white', padding: '5px', border: '1px solid black' }}>
                            {bit}
                        </span>
                    ))}
                </div>
        
                <div style={{ marginTop: '10px' }}>
                <button style={buttonStyle} onClick={emptySelection}>Empty Selection</button>
            </div>
            
      {/* Show/Hide Code button */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'right', marginBottom: '20px'}}>
          <button className="code-button" onClick={toggleCode} style={buttonStyleCode}>
          {showCode ? <i class="fa fa-code-fork fa-sm"></i> : <i class="fa fa-code-fork fa-sm"></i>}
          </button>
      </div>

      {showCode && (
    <div className="code-container" style={{ width: '100%', marginBottom: '20px', marginTop: '20px' }}>
        <pre style={{ padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', background: '#f7f7f7' }}>
            <code>
{`/////////////////////////////////////////////// Seating Map
// Get the bitmap representation
app.get('/seating', (req, res) => {
    client.get('seats', (err, reply) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch seats' });
        const bitmap = reply ? parseInt(reply, 2) : 0; // Convert binary string to integer
        res.json({ bitmap });
    });
});

// Set a seat or deselect
app.post('/setSeat', (req, res) => {
    const seatIndex = req.body.seatIndex;
    client.get('seats', (err, reply) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch seats' });
        let bitmap = reply ? parseInt(reply, 2) : 0;
        
        // Toggle the bit
        bitmap ^= (1 << seatIndex);
        
        // Check if the number of set bits exceeds 8
        if (bitmap.toString(2).split('1').length - 1 > 8) {
            return res.status(400).json({ error: 'Booking is limited to 8 seats maximum.' });
        }

        client.set('seats', bitmap.toString(2).padStart(16, '0'), (error) => {
            if (error) return res.status(500).json({ error: 'Failed to update seat' });
            res.json({ bitmap });
        });
    });
});

app.post('/emptySelection', (req, res) => {
    client.set('seats', '0000000000000000', (err) => {
        if (err) {
            res.status(500).json({ error: "Failed to reset the seats" });
        } else {
            res.json({ message: "Seats reset successfully" });
        }
    });
});


//////////////////////////////////////////////;`}
            </code>
        </pre>
    </div>
)}


  </div>
);

}
export default SeatingMap;