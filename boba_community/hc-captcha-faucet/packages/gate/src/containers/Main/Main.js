import React, { useEffect, useState } from 'react'
import {
    BrowserRouter as Router,
    Route
  } from "react-router-dom";

// Page
import Header from '../../components/Header/Header'
import Home from '../Home/Home'

import './Main.css'
import 'antd/dist/antd.css';

function Main() {
    return (
        <Router>
            <div className='container'>
                <Header />
                <Route exact path="/" component={() => <Home />} />
                <div className='background'></div>
            </div>
        </Router>
    )
}

export default Main