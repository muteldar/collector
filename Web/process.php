<?php
  class DBOpen extends SQLite3
  {
    function __construct()
    {
      $this->open('mail.db');
    }
  }

  if(!file_exists('mail.db'))
  {
    $db = new DBOpen();
    $db->exec('CREATE TABLE IF NOT EXISTS mail(ID INTEGER PRIMARY KEY AUTOINCREMENT, EMAIL TEXT NOT NULL, TIMESTAMP TEXT NOT NULL)');
    $db->close();
  }

  if(ajax_request())
  {
    if (isset($_POST["email"]) && !empty($_POST["email"]))
    {
        $emailsubmit = $_POST["email"];
        if(filter_var($emailsubmit, FILTER_VALIDATE_EMAIL))
        {
          try
          {
            $db = new DBOpen();
            $emailclean = $db->escapeString( $emailsubmit );
            $querystatement = $db->prepare('SELECT ID FROM mail WHERE EMAIL=:email');
            $querystatement->bindValue(':email', $emailclean, SQLITE3_TEXT);
            $result = $querystatement->execute();
            if(!$result->fetchArray())
            {
              $timestamp = $db->escapeString( date("U") );
              $statement = $db->prepare('INSERT INTO mail ( EMAIL, TIMESTAMP ) VALUES ( :email, :timestamp)');
              $statement->bindValue(':email', $emailclean, SQLITE3_TEXT);
              $statement->bindValue(':timestamp', $timestamp, SQLITE3_TEXT);
              $statement->execute();
              echo 1;
            }
            else
            {
              echo 2;
            }
            $db->close();
          }
          catch (Exception $e)
          {
            $db->close();
            echo 0;
          }
        }
        else
        {
          echo 0;
        }
    }
    else
    {
      echo 0;
    }
  }

  function ajax_request() {
    return isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';
  }
?>
