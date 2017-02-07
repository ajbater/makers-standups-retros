import React, { Component } from 'react';
import Layout from './Layout';
import Board from './Board';
import UserInfo from './UserInfo';

class RetroPage extends Component {
  render () {

    let titles = ["Successes", "Struggles", "Suggestions", "Actions"]

    return (
      <div className="boardContainer">
        <div className="retroPageContent">
          <div className="logo">
            <Layout />
          </div>
          <div className="retroBoard">
            <Board titles={ titles } />
          </div>
        </div>
        <div className="userInfo">
          <UserInfo />
        </div>
      </div>
    )
  }
}

export default RetroPage
