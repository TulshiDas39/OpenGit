package com.bsse.gitstudio;

import com.bsse.views.MainScene;
import javafx.application.Application;
import javafx.stage.Stage;


public class App extends Application {

     /**
     * @param args the command line arguments
     */
    public static void main(String[] args) {
        launch(args);
    }

    @Override
    public void start(Stage stage){
        stage.setTitle("Hello World!");		
        stage.setScene(new MainScene());        
        
        stage.setMaximized(true);
        stage.show();        
    }
    

}