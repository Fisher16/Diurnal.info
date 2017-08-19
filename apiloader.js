//neat because can be imprecise with request
var request='Nolan';
//Google Knowledge Graph API
    $(document).ready(function() {
     // $.get('request',function(data){
     //   request=data;      
      var service_url = 'https://kgsearch.googleapis.com/v1/entities:search';
      var params = {
        'query': request,
        'limit': 1,
        'indent': true,
        'key' : 'API_KEY',
        'types':'Person'
      };
      //getJSON needs callback othewise dont work
      $.getJSON(service_url + '?callback=?', params, function(response) {
        $.each(response.itemListElement, function(i, element) {
          request=element['result']['name'];
          $( ".apiName" ).html( request );
          $( ".apiDescription" ).html( element['result']['detailedDescription']['articleBody'] );
          if(element['result'].hasOwnProperty('image')){
            var url=element['result']['image']['contentUrl'];
            if(url.match('^http://')) url = url.replace("http://","https://")
            var imgUrl='<img src=\"'+ url + '\">';
            $( ".apiUrlImg" ).html( imgUrl );
          }
          if(element['result'].hasOwnProperty('url')){
            var url = element['result']['url'];
            var htmlUrl='<a href=\"'+url+'\">';

            var urlShort=url.split('/');
            urlShort[2]=urlShort[2].replace(/www\./, "");
            htmlUrl+=urlShort[2]+"</a>";
            $( ".apiUrl" ).html( htmlUrl );
          }
        });

        //Wikidata API
        request=encodeURIComponent(request);
        var wdUrl="https://www.wikidata.org/w/api.php?action=wbgetentities";
        var wdUrlDate=wdUrl+"&format=json&callback=?&props=claims&sites=enwiki&titles="+request;
        $.getJSON(wdUrlDate, function(result) {
	  //date
          var queryId=Object.keys(result.entities)[0];
          var propsLvl=result.entities[queryId].claims;
          var value=propsLvl['P569'][0].mainsnak.datavalue.value.time.toString().split("T");
          value[0]=value[0].replace(/^\+/,"");
          var dateB=value[0].split("-");
          var fullDateB=dateB[2]+'.'+dateB[1]+'.'+dateB[0];
          var dateBirth=new Date(dateB[0],dateB[1],dateB[2]);
          //Place
          var placeId=propsLvl['P19'][0].mainsnak.datavalue.value.id;
          var place='';
          var wdUrlPlace=wdUrl+"&props=labels|claims&languages=en&callback=?&format=json&ids="+placeId;
          $.getJSON(wdUrlPlace,function(result){
            place=result.entities[placeId].labels.en.value;
            propsLvl=result.entities[placeId].claims;
            if(propsLvl.hasOwnProperty('P17')){
              var countryId=propsLvl['P17'][0].mainsnak.datavalue.value.id;
              var wdUrlCountry=wdUrl+"&props=labels&languages=en&callback=?&format=json&ids="+countryId;
              $.getJSON(wdUrlCountry,function(result){
                $( ".apiWikiBorn" ).html(fullDateB+", "+place+'('+result.entities[countryId].labels.en.value+')');
              });
            }
            else $( ".apiWikiBorn" ).html(fullDateB+", "+place);
          });
          //deied
          if(propsLvl.hasOwnProperty('P570')){
            var value=propsLvl['P570'][0].mainsnak.datavalue.value.time.toString().split("T");
            value[0]=value[0].replace(/^\+/,"");
            var dateD=value[0].split("-");
            var fullDateD=dateD[2]+'.'+dateD[1]+'.'+dateD[0];
            var dateDeath=new Date(dateD[0],dateD[1],dateD[2]);
            $( ".apiWikiDied" ).html("<b>Died: </b>"+fullDateD+"(age "+Math.floor((dateDeath-dateBirth)/31536000000)+")");
          }
          //movement
          if(propsLvl.hasOwnProperty('P135')){
            movementId=propsLvl['P135'][0].mainsnak.datavalue.value.id;
            var wdUrlMovement=wdUrl+"&props=labels|sitelinks&sitefilter=enwiki&languages=en&callback=?&format=json&ids="+movementId;
            $.getJSON(wdUrlMovement,function(result){
              movementName=result.entities[movementId].labels.en.value;
              movementTitle=result.entities[movementId].sitelinks.enwiki.title;
              movementTitle=encodeURIComponent(movementTitle);
              $( ".apiWikiMovement" ).html("<b>Movement: </b>"+'<a href=\"'+"https://en.wikipedia.org/?title="+movementTitle+'\">'+movementName+"</a>");
            });
          }
          //IMDb id
          imdbId=propsLvl['P345'][0].mainsnak.datavalue.value;
	  $(".imdbUrl").html('<a href=\"'+"https://www.imdb.com/name/"+imdbId+'\">'+"imdb</a>");
          //MovieDB
          var mdbUrl="https://api.themoviedb.org/3/";
          var mdbUrlFind=mdbUrl+"find/"+imdbId+"?api_key=cb2accf5dd5f17ef5ae47373f1e6c1c5&callback=?&language=en-US&external_source=imdb_id";

          $.getJSON(mdbUrlFind, function(result) {
              var tmdbId=result.person_results["0"].id;
              mdbUrl+="person/"+tmdbId+"/movie_credits?api_key=cb2accf5dd5f17ef5ae47373f1e6c1c5&callback=?&language=en-US";

              $.getJSON(mdbUrl, function(result) {
                  var list=[];
                  result.crew.forEach(function(obj){
                    var score=obj.vote_average/4.2
                    var today=new Date();
	             if(obj.hasOwnProperty('release_date')){
			var age=today.getFullYear()-(obj.release_date.split("-"))[0];
                    	if(age!=today.getFullYear())
                    	score+=age/42;
			}
                    if(obj.department=="Directing")list.push(obj.id);
                    for(var i=0;i<list.length;++i)if(obj.department=="Writing"&&obj.id==list[i])score+=0.42;
                    obj.score=score/4.2;
                  });
                  var top=[];
                  result.crew.forEach(function(obj){
		  if(top.length<3){
                    if(top.length==0)top.push(obj);
		    if(top.length==1&&top[0].id!=obj.id)top.push(obj);
		    if(top.length==2&&top[1].id!=obj.id&&top[0].id!=obj.id)top.push(obj);
		    }
		  else {
                      top.sort(function(a, b) {
                        return a.score - b.score;
                      });
                      if(top[0].score<obj.score)if(top[2].id!=obj.id&&top[1].id!=obj.id)top[0]=obj;
                    }
                  });
                  //#1
                  var mdbPoster='<img src=\"https://image.tmdb.org/t/p/w342';

                  $( ".title1" ).html( top[2]['title'] );
                  if(top[2]['poster_path'])$( ".mdbImg1" ).html( mdbPoster+ top[2]['poster_path'] + '\">' );
                  $( ".description1" ).html( top[2]['overview'] );

                  $( ".title2" ).html( top[1]['title'] );
                  if(top[1]['poster_path'])$( ".mdbImg2" ).html( mdbPoster+ top[1]['poster_path'] + '\">' );
                  $( ".description2" ).html( top[1]['overview'] );

                  $( ".title3" ).html( top[0]['title'] );
                  if(top[0]['poster_path'])$( ".mdbImg3" ).html( mdbPoster+ top[0]['poster_path'] + '\">' );
                  $( ".description3" ).html( top[0]['overview'] );
              });
          });

        });//wikidata

        //Wikipedia API

        var wpUrl="https://en.wikipedia.org/w/api.php?action=query&titles=";
        wpUrl+=request+"&format=json&callback=?&prop=extracts&exintro=1";
        $.getJSON(wpUrl, function(result) {
            var pageid = [];
            for( var id in result.query.pages )pageid.push( id );
            var wikiExtract=result.query.pages[pageid]['extract'];
            $( ".apiWikiExtract" ).html(wikiExtract);
            $( ".apiWikiExtract" ).find('p').first().remove();
            $( ".apiWikiExtract" ).find('p').slice(2).remove();
            $(".apiWikiUrl").html('<a href=\"'+"https://en.wikipedia.org/?curid="+pageid+'\">'+"wiki</a>");
        });

      });//googleapi
   // });//request loading
    });//docready

