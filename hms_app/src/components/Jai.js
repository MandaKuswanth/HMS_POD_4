import { react } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';


const Jai = (props) => {


    let [count, setCount] = useState(0)


    console.log(props)
    console.log('rendering Jai component')
    console.log('count value:', count)


    return (<View><Text>Jai</Text>
        <Text style={styles.textstyle}>bye {props.name}</Text>

        <TouchableOpacity onPress={() => setCount(count + 1)}>
            <Text>Increment  </Text>
        </TouchableOpacity>

        <Text>Count: {count}</Text>

    </View>)

}



const styles = StyleSheet.create({
    textstyle: {
        color: 'red',
    }
})

export default Jai;